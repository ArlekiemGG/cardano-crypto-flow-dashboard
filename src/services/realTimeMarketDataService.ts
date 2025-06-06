import { supabase } from '@/integrations/supabase/client';
import { blockfrostService } from './blockfrostService';
import { minswapService } from './minswapService';
import { sundaeSwapService } from './sundaeSwapService';
import { muesliSwapService } from './muesliSwapService';
import { wingRidersService } from './wingRidersService';

interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

export class RealTimeMarketDataService {
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private subscribers: Array<(data: RealTimePrice[]) => void> = [];
  private currentPrices: RealTimePrice[] = [];
  private readonly UPDATE_INTERVAL = 10000; // 10 seconds for real APIs
  private readonly RECONNECT_INTERVAL = 30000; // 30 seconds
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  async startRealTimeUpdates(intervalSeconds: number = 10) {
    if (this.isRunning) {
      console.log('🔄 Real-time updates already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting REAL-TIME market data updates with live DEX APIs...');

    // Initial fetch from all DEXs
    await this.fetchAllRealData();

    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      try {
        await this.fetchAllRealData();
        this.retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('❌ Error in periodic update:', error);
        this.handleUpdateError();
      }
    }, intervalSeconds * 1000);

    console.log(`✅ Real-time updates started with ${intervalSeconds}s interval`);
  }

  private async fetchAllRealData() {
    console.log('📊 Fetching REAL data from all Cardano DEX APIs...');
    const allPrices: RealTimePrice[] = [];

    try {
      // Fetch from CoinGecko for ADA reference price
      const adaData = await blockfrostService.getCompleteADAData();
      if (adaData) {
        allPrices.push({
          dex: 'CoinGecko',
          pair: 'ADA/USD',
          price: adaData.price,
          volume24h: adaData.volume24h,
          liquidity: adaData.marketCap,
          lastUpdate: new Date().toISOString()
        });
        console.log('✅ CoinGecko ADA data fetched:', adaData.price);
      }

      // Fetch from Minswap
      try {
        const minswapPrices = await minswapService.calculateRealPrices();
        minswapPrices.forEach(price => {
          allPrices.push({
            dex: 'Minswap',
            pair: price.pair,
            price: price.price,
            volume24h: price.volume24h,
            liquidity: price.reserveA + price.reserveB,
            lastUpdate: new Date().toISOString()
          });
        });
        console.log(`✅ Minswap: ${minswapPrices.length} pairs fetched`);
      } catch (error) {
        console.error('⚠️ Minswap API error:', error);
      }

      // Fetch from SundaeSwap
      try {
        const sundaePrices = await sundaeSwapService.calculateRealPrices();
        sundaePrices.forEach(price => {
          allPrices.push({
            dex: 'SundaeSwap',
            pair: price.pair,
            price: price.price,
            volume24h: price.volume24h,
            liquidity: price.tvl,
            lastUpdate: new Date().toISOString()
          });
        });
        console.log(`✅ SundaeSwap: ${sundaePrices.length} pairs fetched`);
      } catch (error) {
        console.error('⚠️ SundaeSwap API error:', error);
      }

      // Fetch from MuesliSwap
      try {
        const muesliPrices = await muesliSwapService.calculateRealPrices();
        muesliPrices.forEach(price => {
          allPrices.push({
            dex: 'MuesliSwap',
            pair: price.pair,
            price: price.price,
            volume24h: price.volume24h,
            liquidity: price.liquidity,
            lastUpdate: new Date().toISOString()
          });
        });
        console.log(`✅ MuesliSwap: ${muesliPrices.length} pairs fetched`);
      } catch (error) {
        console.error('⚠️ MuesliSwap API error:', error);
      }

      // Fetch from WingRiders
      try {
        const wingRidersPrices = await wingRidersService.calculateRealPrices();
        wingRidersPrices.forEach(price => {
          allPrices.push({
            dex: 'WingRiders',
            pair: price.pair,
            price: price.price,
            volume24h: price.volume24h,
            liquidity: price.tvl,
            lastUpdate: new Date().toISOString()
          });
        });
        console.log(`✅ WingRiders: ${wingRidersPrices.length} pairs fetched`);
      } catch (error) {
        console.error('⚠️ WingRiders API error:', error);
      }

      // Update current prices and cache in database
      this.currentPrices = allPrices;
      await this.cacheRealDataInDatabase(allPrices);
      
      // Notify all subscribers
      this.notifySubscribers(allPrices);

      console.log(`📈 Total REAL prices fetched: ${allPrices.length} from ${new Set(allPrices.map(p => p.dex)).size} DEXs`);

    } catch (error) {
      console.error('❌ Error fetching real market data:', error);
      throw error;
    }
  }

  private async cacheRealDataInDatabase(prices: RealTimePrice[]) {
    try {
      // Clear old data (keep last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('market_data_cache')
        .delete()
        .lt('timestamp', yesterday);

      // Insert new real data
      const insertData = prices.map(price => ({
        pair: price.pair,
        price: price.price,
        volume_24h: price.volume24h,
        source_dex: price.dex,
        timestamp: price.lastUpdate,
        high_24h: price.price * 1.05, // Estimate 5% range
        low_24h: price.price * 0.95,
        market_cap: price.liquidity
      }));

      const { error } = await supabase
        .from('market_data_cache')
        .insert(insertData);

      if (error) {
        console.error('❌ Error caching real data:', error);
      } else {
        console.log('✅ Real market data cached successfully');
      }
    } catch (error) {
      console.error('❌ Database cache error:', error);
    }
  }

  private handleUpdateError() {
    this.retryCount++;
    console.error(`❌ Update failed (${this.retryCount}/${this.MAX_RETRIES})`);

    if (this.retryCount >= this.MAX_RETRIES) {
      console.log('🔄 Max retries reached, attempting reconnection...');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setInterval(async () => {
      try {
        console.log('🔄 Attempting to reconnect to real DEX APIs...');
        await this.fetchAllRealData();
        
        // If successful, clear reconnect interval
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
        this.retryCount = 0;
        console.log('✅ Reconnection successful');
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, this.RECONNECT_INTERVAL);
  }

  stopRealTimeUpdates() {
    if (!this.isRunning) return;

    console.log('🛑 Stopping real-time market data updates...');
    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    console.log('✅ Real-time updates stopped');
  }

  subscribe(callback: (data: RealTimePrice[]) => void) {
    this.subscribers.push(callback);
    
    // Send current data immediately if available
    if (this.currentPrices.length > 0) {
      callback(this.currentPrices);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(data: RealTimePrice[]) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error notifying subscriber:', error);
      }
    });
  }

  getCurrentPrices(): RealTimePrice[] {
    return this.currentPrices;
  }

  // Get prices for specific DEX
  getDEXPrices(dexName: string): RealTimePrice[] {
    return this.currentPrices.filter(price => price.dex === dexName);
  }

  // Get specific pair across all DEXs
  getPairPrices(pairName: string): RealTimePrice[] {
    return this.currentPrices.filter(price => 
      price.pair.toLowerCase().includes(pairName.toLowerCase())
    );
  }

  // Get connection status
  isConnected(): boolean {
    return this.isRunning && this.currentPrices.length > 0;
  }

  // Force refresh
  async forceRefresh() {
    console.log('🔄 Force refreshing real market data...');
    await this.fetchAllRealData();
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
