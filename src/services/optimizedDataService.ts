
import { supabase } from '@/integrations/supabase/client';

interface CacheStats {
  lastUpdate: Date;
  hitRate: number;
  missRate: number;
}

class OptimizedDataService {
  private cacheStats: CacheStats = {
    lastUpdate: new Date(),
    hitRate: 0,
    missRate: 0
  };

  async getCurrentPrices(pairs?: string[]): Promise<any> {
    try {
      let query = supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (pairs && pairs.length > 0) {
        query = query.in('pair', pairs);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching current prices:', error);
      return [];
    }
  }

  async getCardanoProtocols(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('source_dex', 'DeFiLlama')
        .order('volume_24h', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching Cardano protocols:', error);
      return [];
    }
  }

  async getCardanoDexVolumes(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('source_dex, volume_24h')
        .not('volume_24h', 'is', null)
        .order('volume_24h', { ascending: false });

      if (error) throw error;

      // Group by DEX and sum volumes
      const dexVolumes = data?.reduce((acc, item) => {
        const dex = item.source_dex;
        if (!acc[dex]) {
          acc[dex] = 0;
        }
        acc[dex] += Number(item.volume_24h) || 0;
        return acc;
      }, {} as Record<string, number>);

      return dexVolumes || {};
    } catch (error) {
      console.error('Error fetching DEX volumes:', error);
      return {};
    }
  }

  async refreshCriticalData(): Promise<void> {
    console.log('🔄 Refreshing critical data...');
    // This would typically trigger a refresh of cached data
    this.cacheStats.lastUpdate = new Date();
  }

  getCacheStats(): CacheStats {
    return { ...this.cacheStats };
  }
}

export const optimizedDataService = new OptimizedDataService();
