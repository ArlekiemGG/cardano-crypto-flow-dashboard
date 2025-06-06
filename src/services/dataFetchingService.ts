
import { supabase } from '@/integrations/supabase/client';

interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

export class DataFetchingService {
  private lastFetchTime = 0;
  private readonly MIN_FETCH_INTERVAL = 30000;

  async fetchSimplifiedData(): Promise<RealTimePrice[]> {
    const now = Date.now();
    
    if (now - this.lastFetchTime < this.MIN_FETCH_INTERVAL) {
      console.log('⏳ Skipping fetch - too soon since last update');
      return [];
    }

    this.lastFetchTime = now;
    
    console.log('📊 Fetching simplified data (Blockfrost + DeFiLlama only)...');
    const allPrices: RealTimePrice[] = [];

    try {
      // Use the simplified edge function
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Simplified edge function error:', error);
        throw error;
      }

      console.log('✅ Simplified backend response:', data);

      // Get cached data from database
      const { data: cachedData, error: cacheError } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 1800000).toISOString()) // Last 30 minutes
        .order('timestamp', { ascending: false });

      if (cacheError) {
        console.error('❌ Error fetching cached data:', cacheError);
        return [];
      }

      if (cachedData && cachedData.length > 0) {
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
        
        console.log(`📊 Loaded ${allPrices.length} simplified price entries`);
      }

      console.log(`📈 Simplified data fetch completed: ${allPrices.length} prices from ${new Set(allPrices.map(p => p.dex)).size} sources`);
      return allPrices;

    } catch (error) {
      console.error('❌ Error fetching simplified data:', error);
      throw error;
    }
  }

  canFetch(): boolean {
    const now = Date.now();
    return now - this.lastFetchTime >= this.MIN_FETCH_INTERVAL;
  }

  getLastFetchTime(): number {
    return this.lastFetchTime;
  }

  resetFetchTime(): void {
    this.lastFetchTime = 0;
  }
}

export const dataFetchingService = new DataFetchingService();
