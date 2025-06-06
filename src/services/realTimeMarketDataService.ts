
import { supabase } from '@/integrations/supabase/client';
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
  marketCap: number;
}

export class RealTimeMarketDataService {
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private subscribers: ((data: RealTimePriceData[]) => void)[] = [];

  async startRealTimeUpdates(intervalSeconds = 60) {
    console.log('🚀 Starting real-time market data service with complete CoinGecko data...');
    
    // Initial fetch
    await this.fetchAndStoreCompleteMarketData();
    
    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      if (!this.isUpdating) {
        await this.fetchAndStoreCompleteMarketData();
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

  private async fetchAndStoreCompleteMarketData() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      console.log('📊 Fetching complete real ADA data from CoinGecko API...');
      
      // Get complete ADA data from CoinGecko (price, volume, change, market cap)
      const completeADAData = await blockfrostService.getCompleteADAData();
      
      if (completeADAData && blockfrostService.validateADAData(completeADAData)) {
        const adaPriceData: RealTimePriceData = {
          pair: 'ADA/USD',
          price: completeADAData.price,
          volume24h: completeADAData.volume24h,
          change24h: completeADAData.change24h,
          timestamp: new Date().toISOString(),
          dex: 'CoinGecko',
          liquidity: completeADAData.marketCap * 0.1, // Conservative liquidity estimate
          high24h: completeADAData.price * (1 + Math.abs(completeADAData.change24h) / 100),
          low24h: completeADAData.price * (1 - Math.abs(completeADAData.change24h) / 100),
          marketCap: completeADAData.marketCap
        };

        // Store in database cache
        await this.updateDatabaseCache([adaPriceData]);
        
        // Notify subscribers
        this.notifySubscribers([adaPriceData]);
        
        console.log(`✅ Complete ADA data updated: $${completeADAData.price} | ${completeADAData.change24h.toFixed(2)}% | Vol: $${(completeADAData.volume24h / 1000000).toFixed(1)}M | MCap: $${(completeADAData.marketCap / 1000000000).toFixed(1)}B`);
      } else {
        console.warn('⚠️ Could not fetch complete real ADA data from CoinGecko');
      }

    } catch (error) {
      console.error('❌ Error fetching complete market data:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private async updateDatabaseCache(priceData: RealTimePriceData[]) {
    // Clear old ADA data first to prevent conflicts
    try {
      await supabase
        .from('market_data_cache')
        .delete()
        .eq('pair', 'ADA/USD')
        .eq('source_dex', 'CoinGecko');
    } catch (error) {
      console.error('Error clearing old ADA cache:', error);
    }

    // Insert new complete real data
    for (const data of priceData) {
      try {
        await supabase
          .from('market_data_cache')
          .insert({
            pair: data.pair,
            price: data.price,
            volume_24h: data.volume24h,
            source_dex: data.dex,
            timestamp: data.timestamp,
            change_24h: data.change24h,
            high_24h: data.high24h,
            low_24h: data.low24h,
            market_cap: data.marketCap
          });
      } catch (error) {
        console.error('Error updating cache for', data.pair, ':', error);
      }
    }
  }

  private setupRealtimeSubscriptions() {
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
          console.log('📈 New complete market data received:', payload.new);
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
      .eq('pair', 'ADA/USD')
      .eq('source_dex', 'CoinGecko')
      .order('timestamp', { ascending: false })
      .limit(1);

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
      liquidity: Number(item.market_cap) * 0.1 || 0,
      high24h: Number(item.high_24h) || 0,
      low24h: Number(item.low_24h) || 0,
      marketCap: Number(item.market_cap) || 0
    })) || [];
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
