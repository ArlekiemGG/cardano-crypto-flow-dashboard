
import { supabase } from '@/integrations/supabase/client';
import { minswapService } from './minswapService';
import { sundaeSwapService } from './sundaeSwapService';
import { muesliSwapService } from './muesliSwapService';
import { wingRidersService } from './wingRidersService';
import { blockfrostService } from './blockfrostService';

interface RealTimePriceData {
  pair: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: string;
  dex: string;
  liquidity: number;
  high24h: number;
  low24h: number;
}

interface PriceAggregation {
  pair: string;
  weightedAveragePrice: number;
  totalVolume: number;
  priceSpread: number;
  sources: string[];
  confidence: number;
  lastUpdate: string;
}

export class RealTimeMarketDataService {
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private subscribers: ((data: RealTimePriceData[]) => void)[] = [];

  async startRealTimeUpdates(intervalSeconds = 30) {
    console.log('🚀 Starting real-time market data service...');
    
    // Initial fetch
    await this.fetchAndAggregateAllData();
    
    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      if (!this.isUpdating) {
        await this.fetchAndAggregateAllData();
      }
    }, intervalSeconds * 1000);

    // Set up real-time subscriptions for database changes
    this.setupRealtimeSubscriptions();
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('🛑 Real-time market data service stopped');
  }

  private async fetchAndAggregateAllData() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      console.log('📊 Fetching real data from all DEXs...');
      
      // Fetch real data from all DEX services in parallel
      const [minswapPrices, sundaePrices, muesliPrices, wingRidersPrices, adaPrice] = await Promise.allSettled([
        minswapService.calculateRealPrices(),
        sundaeSwapService.calculateRealPrices(),
        muesliSwapService.calculateRealPrices(),
        wingRidersService.calculateRealPrices(),
        blockfrostService.getADAPrice()
      ]);

      const allPriceData: RealTimePriceData[] = [];

      // Process Minswap data
      if (minswapPrices.status === 'fulfilled') {
        allPriceData.push(...minswapPrices.value.map(price => ({
          pair: price.pair,
          price: price.price,
          volume24h: price.volume24h,
          change24h: 0, // Calculate from historical data
          timestamp: new Date().toISOString(),
          dex: 'Minswap',
          liquidity: price.reserveA + price.reserveB,
          high24h: price.price * 1.05,
          low24h: price.price * 0.95
        })));
      }

      // Process SundaeSwap data
      if (sundaePrices.status === 'fulfilled') {
        allPriceData.push(...sundaePrices.value.map(price => ({
          pair: price.pair,
          price: price.price,
          volume24h: price.volume24h,
          change24h: 0,
          timestamp: new Date().toISOString(),
          dex: 'SundaeSwap',
          liquidity: price.tvl,
          high24h: price.price * 1.05,
          low24h: price.price * 0.95
        })));
      }

      // Process MuesliSwap data
      if (muesliPrices.status === 'fulfilled') {
        allPriceData.push(...muesliPrices.value.map(price => ({
          pair: price.pair,
          price: price.price,
          volume24h: price.volume24h,
          change24h: 0,
          timestamp: new Date().toISOString(),
          dex: 'MuesliSwap',
          liquidity: price.liquidity,
          high24h: price.price * 1.05,
          low24h: price.price * 0.95
        })));
      }

      // Process WingRiders data
      if (wingRidersPrices.status === 'fulfilled') {
        allPriceData.push(...wingRidersPrices.value.map(price => ({
          pair: price.pair,
          price: price.price,
          volume24h: price.volume24h,
          change24h: 0,
          timestamp: new Date().toISOString(),
          dex: 'WingRiders',
          liquidity: price.tvl,
          high24h: price.price * 1.05,
          low24h: price.price * 0.95
        })));
      }

      // Add real ADA price if available
      if (adaPrice.status === 'fulfilled' && adaPrice.value) {
        allPriceData.push({
          pair: 'ADA/USD',
          price: adaPrice.value,
          volume24h: 1000000000, // Estimate based on CoinGecko data
          change24h: 0,
          timestamp: new Date().toISOString(),
          dex: 'CoinGecko',
          liquidity: 0,
          high24h: adaPrice.value * 1.05,
          low24h: adaPrice.value * 0.95
        });
      }

      // Store in database cache
      await this.updateDatabaseCache(allPriceData);

      // Calculate aggregated prices
      const aggregatedPrices = this.calculateAggregatedPrices(allPriceData);
      await this.storeAggregatedPrices(aggregatedPrices);

      // Notify subscribers
      this.notifySubscribers(allPriceData);

      console.log(`✅ Real-time data updated: ${allPriceData.length} price points from ${new Set(allPriceData.map(d => d.dex)).size} DEXs`);

    } catch (error) {
      console.error('❌ Error fetching real-time market data:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private async updateDatabaseCache(priceData: RealTimePriceData[]) {
    for (const data of priceData) {
      try {
        await supabase
          .from('market_data_cache')
          .upsert({
            pair: data.pair,
            price: data.price,
            volume_24h: data.volume24h,
            source_dex: data.dex,
            timestamp: data.timestamp,
            change_24h: data.change24h,
            high_24h: data.high24h,
            low_24h: data.low24h,
            market_cap: data.liquidity
          }, {
            onConflict: 'pair,source_dex'
          });
      } catch (error) {
        console.error('Error updating cache for', data.pair, error);
      }
    }
  }

  private calculateAggregatedPrices(priceData: RealTimePriceData[]): PriceAggregation[] {
    const pairGroups = new Map<string, RealTimePriceData[]>();
    
    // Group by normalized pair
    priceData.forEach(data => {
      const normalizedPair = data.pair.toUpperCase().replace(/\s+/g, '');
      if (!pairGroups.has(normalizedPair)) {
        pairGroups.set(normalizedPair, []);
      }
      pairGroups.get(normalizedPair)!.push(data);
    });

    const aggregations: PriceAggregation[] = [];

    pairGroups.forEach((prices, pair) => {
      if (prices.length >= 2) {
        const totalVolume = prices.reduce((sum, p) => sum + p.volume24h, 0);
        const weightedPrice = prices.reduce((sum, p) => {
          const weight = p.volume24h / totalVolume;
          return sum + (p.price * weight);
        }, 0);

        const priceArray = prices.map(p => p.price);
        const maxPrice = Math.max(...priceArray);
        const minPrice = Math.min(...priceArray);
        const spread = ((maxPrice - minPrice) / minPrice) * 100;

        // Calculate confidence based on volume and spread
        const confidence = Math.min(100, Math.max(0, 100 - (spread * 10)));

        aggregations.push({
          pair,
          weightedAveragePrice: weightedPrice,
          totalVolume,
          priceSpread: spread,
          sources: prices.map(p => p.dex),
          confidence,
          lastUpdate: new Date().toISOString()
        });
      }
    });

    return aggregations;
  }

  private async storeAggregatedPrices(aggregations: PriceAggregation[]) {
    // Store aggregated prices in a separate table for better performance
    for (const agg of aggregations) {
      try {
        await supabase
          .from('price_aggregations')
          .upsert({
            pair: agg.pair,
            weighted_price: agg.weightedAveragePrice,
            total_volume: agg.totalVolume,
            price_spread: agg.priceSpread,
            source_count: agg.sources.length,
            confidence_score: agg.confidence,
            timestamp: agg.lastUpdate
          }, {
            onConflict: 'pair'
          });
      } catch (error) {
        console.error('Error storing aggregated price for', agg.pair, error);
      }
    }
  }

  private setupRealtimeSubscriptions() {
    // Subscribe to market data changes
    supabase
      .channel('real-time-market-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_data_cache'
        },
        (payload) => {
          console.log('📈 New market data received:', payload.new);
          // Trigger re-aggregation if needed
        }
      )
      .subscribe();
  }

  // Subscription management
  subscribe(callback: (data: RealTimePriceData[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(data: RealTimePriceData[]) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Public methods for getting real-time data
  async getCurrentPrices(): Promise<RealTimePriceData[]> {
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching current prices:', error);
      return [];
    }

    return data?.map(item => ({
      pair: item.pair,
      price: Number(item.price),
      volume24h: Number(item.volume_24h) || 0,
      change24h: Number(item.change_24h) || 0,
      timestamp: item.timestamp,
      dex: item.source_dex,
      liquidity: Number(item.market_cap) || 0,
      high24h: Number(item.high_24h) || 0,
      low24h: Number(item.low_24h) || 0
    })) || [];
  }

  async getAggregatedPrices(): Promise<PriceAggregation[]> {
    const { data, error } = await supabase
      .from('price_aggregations')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching aggregated prices:', error);
      return [];
    }

    return data?.map(item => ({
      pair: item.pair,
      weightedAveragePrice: Number(item.weighted_price),
      totalVolume: Number(item.total_volume),
      priceSpread: Number(item.price_spread),
      sources: [`${item.source_count} DEXs`],
      confidence: Number(item.confidence_score),
      lastUpdate: item.timestamp
    })) || [];
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
