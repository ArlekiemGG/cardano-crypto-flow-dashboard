
import { useState, useEffect, useRef } from 'react';
import { optimizedDataService } from '@/services/optimizedDataService';
import { DeFiLlamaPrice, DeFiLlamaProtocol, CacheStats } from '@/services/optimized-data/types';

export interface OptimizedMarketData {
  prices: Record<string, any>;
  protocols: DeFiLlamaProtocol[];
  dexVolumes: any;
  isLoading: boolean;
  lastUpdate: Date;
  dataSource: 'defillama' | 'native' | 'mixed';
  cacheStats: CacheStats;
}

const DEFAULT_DATA: OptimizedMarketData = {
  prices: {},
  protocols: [],
  dexVolumes: null,
  isLoading: true,
  lastUpdate: new Date(),
  dataSource: 'defillama',
  cacheStats: {} as CacheStats
};

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CRITICAL_TOKENS = ['coingecko:cardano'];

export const useFetchOptimizedData = () => {
  const [data, setData] = useState<OptimizedMarketData>(DEFAULT_DATA);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchAllData = async () => {
    try {
      console.log('🚀 Fetching optimized market data...');
      setData(prev => ({ ...prev, isLoading: true }));

      // Parallel fetching for better performance
      const [pricesResult, protocolsResult, volumesResult] = await Promise.allSettled([
        optimizedDataService.getCurrentPrices(CRITICAL_TOKENS),
        optimizedDataService.getCardanoProtocols(),
        optimizedDataService.getCardanoDexVolumes()
      ]);

      // Process results
      const newData: Partial<OptimizedMarketData> = {
        lastUpdate: new Date(),
        isLoading: false,
        cacheStats: optimizedDataService.getCacheStats()
      };

      if (pricesResult.status === 'fulfilled') {
        newData.prices = pricesResult.value;
      } else {
        console.error('❌ Error fetching prices:', pricesResult.reason);
        newData.prices = {};
      }

      if (protocolsResult.status === 'fulfilled') {
        newData.protocols = protocolsResult.value;
      } else {
        console.error('❌ Error fetching protocols:', protocolsResult.reason);
        newData.protocols = [];
      }

      if (volumesResult.status === 'fulfilled') {
        newData.dexVolumes = volumesResult.value;
      } else {
        console.error('❌ Error fetching DEX volumes:', volumesResult.reason);
        newData.dexVolumes = null;
      }

      // Determine predominant data source
      const cacheStats = optimizedDataService.getCacheStats();
      const totalSources = Object.values(cacheStats.sources || {}).reduce((a: number, b: number) => a + b, 0);
      const defiLlamaCount = cacheStats.sources?.defillama || 0;
      
      newData.dataSource = defiLlamaCount / totalSources > 0.7 ? 'defillama' : 
                          defiLlamaCount === 0 ? 'native' : 'mixed';

      setData(prev => ({ ...prev, ...newData }));
      
      console.log(`✅ Optimized data updated - Source: ${newData.dataSource}, Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Error in optimized data fetch:', error);
      setData(prev => ({ 
        ...prev, 
        isLoading: false,
        dataSource: 'native' 
      }));
    }
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing optimized data...');
    await optimizedDataService.refreshCriticalData();
    await fetchAllData();
  };

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing optimized market data service...');
    
    // Initial fetch
    fetchAllData();

    // Set up periodic updates
    intervalRef.current = setInterval(fetchAllData, UPDATE_INTERVAL);

    return () => {
      console.log('🧹 Cleaning up optimized market data service...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

  return {
    data,
    forceRefresh,
    isLoading: data.isLoading,
    lastUpdate: data.lastUpdate,
    dataSource: data.dataSource,
    cacheStats: data.cacheStats
  };
};
