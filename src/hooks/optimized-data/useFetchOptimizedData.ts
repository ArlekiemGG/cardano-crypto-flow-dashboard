
import { useState, useEffect, useRef } from 'react';
import { optimizedDataService } from '@/services/optimizedDataService';
import { DeFiLlamaProtocol, CacheStats } from '@/services/optimized-data/types';

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

export const useFetchOptimizedData = () => {
  const [data, setData] = useState<OptimizedMarketData>(DEFAULT_DATA);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchAllData = async () => {
    try {
      console.log('🚀 Fetching optimized market data from database...');
      setData(prev => ({ ...prev, isLoading: true }));

      // Fetch real data directly from Supabase cache (populated by edge function)
      const [pricesResult, protocolsResult, volumesResult] = await Promise.allSettled([
        optimizedDataService.getCurrentPrices(['ADA/USD']),
        optimizedDataService.getCardanoProtocols(),
        optimizedDataService.getCardanoDexVolumes()
      ]);

      // Process results and create proper data structure
      const newData: Partial<OptimizedMarketData> = {
        lastUpdate: new Date(),
        isLoading: false,
        cacheStats: optimizedDataService.getCacheStats()
      };

      // Process prices result
      if (pricesResult.status === 'fulfilled') {
        // Convert array of price entries to proper structure
        const pricesArray = pricesResult.value;
        if (Array.isArray(pricesArray) && pricesArray.length > 0) {
          // Create a lookup structure for easier access
          const pricesMap: Record<string, any> = {};
          pricesArray.forEach((entry, index) => {
            const key = entry.pair || `entry_${index}`;
            pricesMap[key] = entry;
          });
          newData.prices = pricesMap;
          console.log('✅ Real prices loaded:', Object.keys(pricesMap).length, 'entries');
        } else {
          newData.prices = {};
          console.warn('⚠️ No price data available');
        }
      } else {
        console.error('❌ Error fetching prices:', pricesResult.reason);
        newData.prices = {};
      }

      // Process protocols result
      if (protocolsResult.status === 'fulfilled') {
        newData.protocols = protocolsResult.value || [];
        console.log('✅ Protocols loaded:', newData.protocols.length, 'protocols');
      } else {
        console.error('❌ Error fetching protocols:', protocolsResult.reason);
        newData.protocols = [];
      }

      // Process DEX volumes result
      if (volumesResult.status === 'fulfilled') {
        newData.dexVolumes = volumesResult.value;
        console.log('✅ DEX volumes loaded');
      } else {
        console.error('❌ Error fetching DEX volumes:', volumesResult.reason);
        newData.dexVolumes = null;
      }

      // Determine data source based on what we got
      const hasRealPrices = newData.prices && Object.keys(newData.prices).length > 0;
      const hasRealProtocols = newData.protocols && newData.protocols.length > 0;
      
      if (hasRealPrices && hasRealProtocols) {
        newData.dataSource = 'defillama';
      } else if (hasRealPrices || hasRealProtocols) {
        newData.dataSource = 'mixed';
      } else {
        newData.dataSource = 'native';
      }

      setData(prev => ({ ...prev, ...newData }));
      
      console.log(`✅ Optimized data updated - Source: ${newData.dataSource}, Prices: ${Object.keys(newData.prices || {}).length}, Protocols: ${newData.protocols?.length || 0}`);

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
