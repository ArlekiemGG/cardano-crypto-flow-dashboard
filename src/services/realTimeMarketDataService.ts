
import { supabase } from '@/integrations/supabase/client';

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
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds to avoid rate limits
  private readonly RECONNECT_INTERVAL = 60000; // 60 seconds
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private connectionHealth = {
    minswap: false,
    sundaeswap: false,
    muesliswap: false,
    wingriders: false,
    coingecko: false
  };

  async startRealTimeUpdates(intervalSeconds: number = 30) {
    if (this.isRunning) {
      console.log('🔄 Real-time updates already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting REAL-TIME market data updates...');

    // Initial fetch
    await this.fetchAllRealData();

    // Set up periodic updates with longer interval to avoid rate limits
    this.updateInterval = setInterval(async () => {
      try {
        await this.fetchAllRealData();
        this.retryCount = 0;
      } catch (error) {
        console.error('❌ Error in periodic update:', error);
        this.handleUpdateError();
      }
    }, Math.max(intervalSeconds * 1000, 30000)); // Minimum 30 seconds

    console.log(`✅ Real-time updates started with ${Math.max(intervalSeconds, 30)}s interval`);
  }

  private async fetchAllRealData() {
    console.log('📊 Fetching REAL data using Supabase Edge Function...');
    const allPrices: RealTimePrice[] = [];

    try {
      // Use Supabase Edge Function to fetch data server-side (avoids CORS)
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('✅ Edge function response:', data);

      // Get CoinGecko ADA price (this usually works)
      await this.fetchCoinGeckoData(allPrices);

      // Get cached data from database (populated by edge function)
      await this.fetchCachedData(allPrices);

      // Update connection health
      this.updateConnectionHealth(allPrices);

      // Update current prices and cache
      this.currentPrices = allPrices;
      
      // Notify all subscribers
      this.notifySubscribers(allPrices);

      console.log(`📈 Total REAL prices fetched: ${allPrices.length} from ${new Set(allPrices.map(p => p.dex)).size} sources`);

    } catch (error) {
      console.error('❌ Error fetching real market data:', error);
      
      // Fallback: try to get cached data
      await this.fetchCachedData(allPrices);
      
      if (allPrices.length > 0) {
        this.currentPrices = allPrices;
        this.notifySubscribers(allPrices);
        console.log('📊 Using cached data as fallback');
      }
      
      throw error;
    }
  }

  private async fetchCoinGeckoData(allPrices: RealTimePrice[]) {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/cardano?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
      
      if (response.ok) {
        const data = await response.json();
        const price = data.market_data?.current_price?.usd;
        const volume = data.market_data?.total_volume?.usd;
        
        if (price && volume) {
          allPrices.push({
            dex: 'CoinGecko',
            pair: 'ADA/USD',
            price,
            volume24h: volume,
            liquidity: data.market_data?.market_cap?.usd || 0,
            lastUpdate: new Date().toISOString()
          });
          
          this.connectionHealth.coingecko = true;
          console.log('✅ CoinGecko ADA data fetched:', price);

          // Cache in database using upsert to avoid duplicates
          await this.upsertMarketData({
            pair: 'ADA/USD',
            price,
            volume_24h: volume,
            source_dex: 'CoinGecko',
            timestamp: new Date().toISOString(),
            change_24h: data.market_data?.price_change_percentage_24h || 0,
            high_24h: data.market_data?.high_24h?.usd || price * 1.05,
            low_24h: data.market_data?.low_24h?.usd || price * 0.95,
            market_cap: data.market_data?.market_cap?.usd || 0
          });
        }
      }
    } catch (error) {
      console.error('⚠️ CoinGecko API error:', error);
      this.connectionHealth.coingecko = false;
    }
  }

  private async fetchCachedData(allPrices: RealTimePrice[]) {
    try {
      const { data: cachedData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error fetching cached data:', error);
        return;
      }

      if (cachedData && cachedData.length > 0) {
        cachedData.forEach(item => {
          allPrices.push({
            dex: item.source_dex,
            pair: item.pair,
            price: Number(item.price),
            volume24h: Number(item.volume_24h) || 0,
            liquidity: Number(item.market_cap) || 0,
            lastUpdate: item.timestamp
          });
        });
        
        console.log(`📊 Loaded ${cachedData.length} cached price entries`);
      }
    } catch (error) {
      console.error('❌ Error loading cached data:', error);
    }
  }

  private async upsertMarketData(data: any) {
    try {
      const { error } = await supabase
        .from('market_data_cache')
        .upsert(data, {
          onConflict: 'pair,source_dex',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('❌ Error upserting market data:', error);
      }
    } catch (error) {
      console.error('❌ Upsert error:', error);
    }
  }

  private updateConnectionHealth(prices: RealTimePrice[]) {
    const dexSources = new Set(prices.map(p => p.dex.toLowerCase()));
    
    this.connectionHealth = {
      minswap: dexSources.has('minswap'),
      sundaeswap: dexSources.has('sundaeswap'),
      muesliswap: dexSources.has('muesliswap'),
      wingriders: dexSources.has('wingriders'),
      coingecko: dexSources.has('coingecko')
    };
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
        console.log('🔄 Attempting to reconnect...');
        await this.fetchAllRealData();
        
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

  getDEXPrices(dexName: string): RealTimePrice[] {
    return this.currentPrices.filter(price => 
      price.dex.toLowerCase() === dexName.toLowerCase()
    );
  }

  getPairPrices(pairName: string): RealTimePrice[] {
    return this.currentPrices.filter(price => 
      price.pair.toLowerCase().includes(pairName.toLowerCase())
    );
  }

  isConnected(): boolean {
    return this.isRunning && this.currentPrices.length > 0;
  }

  getConnectionHealth() {
    return this.connectionHealth;
  }

  async forceRefresh() {
    console.log('🔄 Force refreshing real market data...');
    await this.fetchAllRealData();
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
