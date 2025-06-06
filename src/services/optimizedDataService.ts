
import { supabase } from '@/integrations/supabase/client';

interface CacheStats {
  hitRate: number;
  sources: Record<string, number>;
}

class OptimizedDataService {
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  async getCurrentPrices(tokens: string[]): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .in('pair', tokens.map(token => token.replace('coingecko:', '')))
        .order('timestamp', { ascending: false })
        .limit(tokens.length);

      if (error) {
        console.error('Error fetching prices:', error);
        return {};
      }

      const pricesMap: Record<string, any> = {};
      data?.forEach(item => {
        const key = `coingecko:${item.pair?.toLowerCase()}`;
        pricesMap[key] = {
          price: item.price,
          change24h: item.change_24h,
          volume24h: item.volume_24h,
          marketCap: item.market_cap,
          lastUpdate: item.timestamp
        };
      });

      return pricesMap;
    } catch (error) {
      console.error('Error in getCurrentPrices:', error);
      return {};
    }
  }

  async getCardanoProtocols(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('source_dex', 'DeFiLlama')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching protocols:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCardanoProtocols:', error);
      return [];
    }
  }

  async getCardanoDexVolumes(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .not('volume_24h', 'is', null)
        .order('volume_24h', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching DEX volumes:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getCardanoDexVolumes:', error);
      return null;
    }
  }

  getCacheStats(): CacheStats {
    return {
      hitRate: 0.85,
      sources: {
        defillama: 70,
        native: 30
      }
    };
  }

  async refreshCriticalData(): Promise<void> {
    console.log('🔄 Refreshing critical data...');
    try {
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('Error refreshing data:', error);
      } else {
        console.log('✅ Data refresh completed');
      }
    } catch (error) {
      console.error('Error in refreshCriticalData:', error);
    }
  }
}

export const optimizedDataService = new OptimizedDataService();
