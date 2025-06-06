
import { supabase } from '@/integrations/supabase/client';

interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

class OptimizedMarketDataService {
  private subscribers = new Set<(data: RealTimePrice[]) => void>();
  private currentPrices: RealTimePrice[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 45000;
  private lastFetchTime = 0;
  private readonly MIN_FETCH_INTERVAL = 30000;

  async startUpdates() {
    console.log('🚀 Starting optimized market data service...');
    
    // Initial fetch
    await this.fetchData();

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastFetchTime >= this.MIN_FETCH_INTERVAL) {
        this.fetchData();
      }
    }, this.UPDATE_INTERVAL);
  }

  private async fetchData() {
    const now = Date.now();
    
    if (now - this.lastFetchTime < this.MIN_FETCH_INTERVAL) {
      return;
    }

    this.lastFetchTime = now;
    
    try {
      // Use edge function for data fetching
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) throw error;

      // Get cached data from database
      const { data: cachedData, error: cacheError } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 1800000).toISOString())
        .order('timestamp', { ascending: false });

      if (cacheError) throw cacheError;

      if (cachedData && cachedData.length > 0) {
        const prices: RealTimePrice[] = [];
        const seenPairs = new Set<string>();
        
        cachedData.forEach(item => {
          const pairKey = `${item.pair}-${item.source_dex}`;
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            prices.push({
              dex: item.source_dex,
              pair: item.pair,
              price: Number(item.price),
              volume24h: Number(item.volume_24h) || 0,
              liquidity: Number(item.market_cap) || 0,
              lastUpdate: item.timestamp
            });
          }
        });
        
        this.currentPrices = prices;
        this.notifySubscribers(prices);
      }

    } catch (error) {
      console.error('❌ Optimized data fetch error:', error);
    }
  }

  subscribe(callback: (data: RealTimePrice[]) => void) {
    this.subscribers.add(callback);
    
    if (this.currentPrices.length > 0) {
      callback(this.currentPrices);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(data: RealTimePrice[]) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Subscriber notification error:', error);
      }
    });
  }

  getCurrentPrices(): RealTimePrice[] {
    return this.currentPrices;
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear();
  }
}

export const optimizedMarketDataService = new OptimizedMarketDataService();
