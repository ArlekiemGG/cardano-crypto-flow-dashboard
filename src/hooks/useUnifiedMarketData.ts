
import { useState, useEffect, useRef } from 'react';
import { unifiedDataService } from '@/services/unified-data/UnifiedDataService';
import { DeFiLlamaProtocol } from '@/services/optimized-data/types';

interface UnifiedMarketData {
  prices: Record<string, any>;
  protocols: DeFiLlamaProtocol[];
  dexVolumes: any;
  isLoading: boolean;
  lastUpdate: Date;
  dataSource: 'defillama' | 'native' | 'mixed';
  cacheStats: any;
  hasErrors: boolean;
  errorDetails: string[];
}

const DEFAULT_DATA: UnifiedMarketData = {
  prices: {},
  protocols: [],
  dexVolumes: null,
  isLoading: true,
  lastUpdate: new Date(),
  dataSource: 'defillama',
  cacheStats: {},
  hasErrors: false,
  errorDetails: []
};

export const useUnifiedMarketData = () => {
  const [data, setData] = useState<UnifiedMarketData>(DEFAULT_DATA);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchAllData = async () => {
    try {
      console.log('🚀 Fetching unified market data...');
      setData(prev => ({ ...prev, isLoading: true, hasErrors: false, errorDetails: [] }));

      const errors: string[] = [];

      const [pricesResult, protocolsResult, volumesResult] = await Promise.allSettled([
        unifiedDataService.getCurrentPrices(['ADA/USD']).catch(err => {
          errors.push(`Prices error: ${err.message}`);
          return [];
        }),
        unifiedDataService.getCardanoProtocols().catch(err => {
          errors.push(`Protocols error: ${err.message}`);
          return [];
        }),
        unifiedDataService.getCardanoDexVolumes().catch(err => {
          errors.push(`DEX volumes error: ${err.message}`);
          return null;
        })
      ]);

      const newData: Partial<UnifiedMarketData> = {
        lastUpdate: new Date(),
        isLoading: false,
        cacheStats: unifiedDataService.getCacheStats(),
        hasErrors: errors.length > 0,
        errorDetails: errors
      };

      // Process results
      if (pricesResult.status === 'fulfilled') {
        const pricesArray = pricesResult.value;
        const pricesMap: Record<string, any> = {};
        pricesArray.forEach((entry, index) => {
          const key = entry.pair || `entry_${index}`;
          pricesMap[key] = entry;
        });
        newData.prices = pricesMap;
      } else {
        newData.prices = {};
      }

      if (protocolsResult.status === 'fulfilled') {
        newData.protocols = protocolsResult.value;
      } else {
        newData.protocols = [];
      }

      if (volumesResult.status === 'fulfilled') {
        newData.dexVolumes = volumesResult.value;
      } else {
        newData.dexVolumes = null;
      }

      // Determine data source
      const hasRealPrices = Object.keys(newData.prices || {}).length > 0;
      const hasRealProtocols = (newData.protocols || []).length > 0;
      
      if (hasRealPrices && hasRealProtocols) {
        newData.dataSource = 'defillama';
      } else if (hasRealPrices || hasRealProtocols) {
        newData.dataSource = 'mixed';
      } else {
        newData.dataSource = 'native';
      }

      setData(prev => ({ ...prev, ...newData }));
      
      console.log(`✅ Unified data updated - Source: ${newData.dataSource}`);

    } catch (error) {
      console.error('❌ Error in unified data fetch:', error);
      setData(prev => ({ 
        ...prev, 
        isLoading: false,
        dataSource: 'native',
        hasErrors: true,
        errorDetails: [`Critical error: ${error}`]
      }));
    }
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing unified data...');
    await unifiedDataService.refreshData();
    await fetchAllData();
  };

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing unified market data service...');
    
    fetchAllData();
    intervalRef.current = setInterval(fetchAllData, 300000); // 5 minutes

    return () => {
      console.log('🧹 Cleaning up unified market data service...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

  // Helper methods with real data validation
  const getADAPrice = () => {
    if (data.prices && Object.keys(data.prices).length > 0) {
      const adaEntry = Object.values(data.prices).find(entry => 
        typeof entry === 'object' && 
        entry !== null && 
        'pair' in entry && 
        'source_dex' in entry &&
        'price' in entry &&
        (entry.pair === 'ADA/USD' || entry.pair?.includes('ADA')) &&
        entry.source_dex === 'CoinGecko' &&
        typeof entry.price === 'number' &&
        entry.price > 0.1 &&
        entry.price < 10
      );
      
      if (adaEntry && 'price' in adaEntry) {
        return adaEntry.price;
      }
    }
    return 0;
  };

  const getADAChange24h = () => {
    if (data.prices && Object.keys(data.prices).length > 0) {
      const adaEntry = Object.values(data.prices).find(entry => 
        typeof entry === 'object' && 
        entry !== null && 
        'pair' in entry && 
        'source_dex' in entry &&
        'change_24h' in entry &&
        (entry.pair === 'ADA/USD' || entry.pair?.includes('ADA')) &&
        entry.source_dex === 'CoinGecko'
      );
      
      if (adaEntry && 'change_24h' in adaEntry && typeof adaEntry.change_24h === 'number') {
        return adaEntry.change_24h;
      }
    }
    return 0;
  };

  const getTopProtocolsByTVL = (limit: number = 10) => {
    if (!data.protocols) return [];
    
    return data.protocols
      .filter(protocol => protocol.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);
  };

  const getTotalCardanoTVL = () => {
    if (!data.protocols) return 0;
    
    return data.protocols.reduce((total, protocol) => {
      return total + (protocol.tvl || 0);
    }, 0);
  };

  const getTotalDexVolume24h = () => {
    if (!data.dexVolumes?.protocols) return 0;
    
    return data.dexVolumes.protocols.reduce((total: number, protocol: any) => {
      return total + (protocol.total24h || 0);
    }, 0);
  };

  return {
    // Raw data
    prices: data.prices,
    protocols: data.protocols,
    dexVolumes: data.dexVolumes,
    
    // Base info
    isLoading: data.isLoading,
    lastUpdate: data.lastUpdate,
    dataSource: data.dataSource,
    cacheStats: data.cacheStats,
    forceRefresh,
    
    // Error handling
    hasErrors: data.hasErrors,
    errorDetails: data.errorDetails,
    
    // Helper methods
    getADAPrice,
    getADAChange24h,
    getTopProtocolsByTVL,
    getTotalCardanoTVL,
    getTotalDexVolume24h,
    
    // Data quality helpers
    isRealDataAvailable: () => {
      return data.dataSource !== 'native' && 
             getADAPrice() > 0 && 
             (data.dexVolumes?.protocols?.length || 0) > 0;
    },
    
    getDataQuality: () => {
      if (data.dataSource === 'defillama') return 'excellent';
      if (data.dataSource === 'mixed') return 'good';
      return 'poor';
    }
  };
};
