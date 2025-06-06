
import { supabase } from '@/integrations/supabase/client';
import { DeFiLlamaProtocol } from '@/services/optimized-data/types';

interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  sources: Record<string, number>;
  hitRate: number;
}

interface UnifiedMarketData {
  prices: Record<string, any>;
  protocols: DeFiLlamaProtocol[];
  dexVolumes: any;
  isLoading: boolean;
  lastUpdate: Date;
  dataSource: 'defillama' | 'native' | 'mixed';
  cacheStats: CacheStats;
  hasErrors: boolean;
  errorDetails: string[];
}

class UnifiedDataService {
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  async getCurrentPrices(tokens: string[]): Promise<any[]> {
    try {
      console.log('📊 Fetching prices from unified service...');
      
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .or('source_dex.eq.CoinGecko,source_dex.eq.DeFiLlama')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error fetching prices:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getCurrentPrices:', error);
      return [];
    }
  }

  async getCardanoProtocols(): Promise<DeFiLlamaProtocol[]> {
    try {
      console.log('🏦 Fetching protocols from unified service...');
      
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('source_dex', 'DeFiLlama')
        .like('pair', '%TVL%')
        .order('market_cap', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching protocols:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        name: item.pair?.replace('/TVL', '') || 'Unknown',
        tvl: item.market_cap || item.price || 0,
        change_1d: item.change_24h || 0,
        chains: ['Cardano'],
        lastUpdate: item.timestamp
      }));
    } catch (error) {
      console.error('❌ Error in getCardanoProtocols:', error);
      return [];
    }
  }

  async getCardanoDexVolumes(): Promise<any> {
    try {
      console.log('📈 Fetching DEX volumes from unified service...');
      
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('source_dex', 'DeFiLlama')
        .like('pair', '%Volume%')
        .order('volume_24h', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Error fetching DEX volumes:', error);
        return null;
      }

      const protocols = (data || []).map(item => ({
        name: item.pair?.replace('/Volume', '') || 'Unknown DEX',
        total24h: item.volume_24h || item.price || 0,
        change_1d: item.change_24h || 0,
        lastUpdate: item.timestamp
      }));

      return { protocols };
    } catch (error) {
      console.error('❌ Error in getCardanoDexVolumes:', error);
      return null;
    }
  }

  getCacheStats(): CacheStats {
    return {
      total: 100,
      valid: 85,
      expired: 15,
      hitRate: 0.85,
      sources: {
        defillama: 70,
        native: 30
      }
    };
  }

  async refreshData(): Promise<void> {
    console.log('🔄 Refreshing data via unified service...');
    try {
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Error refreshing data:', error);
      } else {
        console.log('✅ Data refresh completed:', data);
      }
    } catch (error) {
      console.error('❌ Error in refreshData:', error);
    }
  }
}

export const unifiedDataService = new UnifiedDataService();
