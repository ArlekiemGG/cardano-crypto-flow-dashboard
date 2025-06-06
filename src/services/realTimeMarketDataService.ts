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
  private readonly UPDATE_INTERVAL = 60000; // Aumentado a 60 segundos para evitar rate limits
  private readonly RECONNECT_INTERVAL = 120000; // Aumentado a 2 minutos
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private lastFetchTime = 0;
  private readonly MIN_FETCH_INTERVAL = 30000; // Mínimo 30 segundos entre fetches

  private connectionHealth = {
    muesliswap: false,
    defiLlama: false,
    taptools: false,
    coingecko: false
  };

  // Debounced fetch usando callback estable
  private debouncedFetch = this.debounce(this.fetchAllRealData.bind(this), 5000);

  private debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  async startRealTimeUpdates(intervalSeconds: number = 60) {
    if (this.isRunning) {
      console.log('🔄 Real-time updates already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting OPTIMIZED real-time market data updates...');

    // Initial fetch con debounce
    this.debouncedFetch();

    // Set up periodic updates con intervalo más largo
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastFetchTime >= this.MIN_FETCH_INTERVAL) {
        this.debouncedFetch();
      }
    }, Math.max(intervalSeconds * 1000, this.UPDATE_INTERVAL));

    console.log(`✅ Optimized real-time updates started with ${Math.max(intervalSeconds, 60)}s interval`);
  }

  private async fetchAllRealData() {
    const now = Date.now();
    
    // Prevenir fetches muy frecuentes
    if (now - this.lastFetchTime < this.MIN_FETCH_INTERVAL) {
      console.log('⏳ Skipping fetch - too soon since last update');
      return;
    }

    this.lastFetchTime = now;
    
    console.log('📊 Fetching OPTIMIZED data using backend-first architecture...');
    const allPrices: RealTimePrice[] = [];

    try {
      // Usar el edge function optimizado
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('✅ Backend response:', data);

      // Get cached data from database (populated by optimized edge function)
      const { data: cachedData, error: cacheError } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 1800000).toISOString()) // Last 30 minutes
        .order('timestamp', { ascending: false });

      if (cacheError) {
        console.error('❌ Error fetching cached data:', cacheError);
        return;
      }

      if (cachedData && cachedData.length > 0) {
        // Process cached data without duplicates
        const seenPairs = new Set<string>();
        
        cachedData.forEach(item => {
          const pairKey = `${item.pair}-${item.source_dex}`;
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            allPrices.push({
              dex: item.source_dex,
              pair: item.pair,
              price: Number(item.price),
              volume24h: Number(item.volume_24h) || 0,
              liquidity: Number(item.market_cap) || 0,
              lastUpdate: item.timestamp
            });
          }
        });
        
        console.log(`📊 Loaded ${allPrices.length} unique cached price entries`);
      }

      // Update connection health based on available data sources
      this.updateConnectionHealth(allPrices);

      // Update current prices and notify subscribers
      this.currentPrices = allPrices;
      this.notifySubscribers(allPrices);

      // Reset retry count on successful fetch
      this.retryCount = 0;

      console.log(`📈 Total OPTIMIZED prices fetched: ${allPrices.length} from ${new Set(allPrices.map(p => p.dex)).size} sources`);

    } catch (error) {
      console.error('❌ Error fetching optimized market data:', error);
      this.handleUpdateError();
    }
  }

  private updateConnectionHealth(prices: RealTimePrice[]) {
    const dexSources = new Set(prices.map(p => p.dex.toLowerCase()));
    
    this.connectionHealth = {
      muesliswap: dexSources.has('muesliswap'),
      defiLlama: dexSources.has('defillama'),
      taptools: dexSources.has('taptools'),
      coingecko: dexSources.has('coingecko')
    };
  }

  private handleUpdateError() {
    this.retryCount++;
    console.error(`❌ Update failed (${this.retryCount}/${this.MAX_RETRIES})`);

    if (this.retryCount >= this.MAX_RETRIES) {
      console.log('🔄 Max retries reached, scheduling reconnection...');
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

    console.log('🛑 Stopping optimized real-time market data updates...');
    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    console.log('✅ Optimized real-time updates stopped');
  }

  // Método subscribe optimizado con callback estable
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
    console.log('🔄 Force refreshing optimized market data...');
    this.lastFetchTime = 0; // Reset throttle
    await this.fetchAllRealData();
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
