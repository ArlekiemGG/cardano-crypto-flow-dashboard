
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
  hasErrors: boolean;
  errorDetails: string[];
}

const DEFAULT_DATA: OptimizedMarketData = {
  prices: {},
  protocols: [],
  dexVolumes: null,
  isLoading: true,
  lastUpdate: new Date(),
  dataSource: 'defillama',
  cacheStats: {} as CacheStats,
  hasErrors: false,
  errorDetails: []
};

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useFetchOptimizedData = () => {
  const [data, setData] = useState<OptimizedMarketData>(DEFAULT_DATA);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchAllData = async () => {
    try {
      console.log('🚀 Fetching optimized market data from database...');
      setData(prev => ({ ...prev, isLoading: true, hasErrors: false, errorDetails: [] }));

      const errors: string[] = [];

      // Fetch real data directly from Supabase cache (populated by edge function)
      const [pricesResult, protocolsResult, volumesResult] = await Promise.allSettled([
        optimizedDataService.getCurrentPrices(['ADA/USD']).catch(err => {
          errors.push(`Prices error: ${err.message}`);
          return {};
        }),
        optimizedDataService.getCardanoProtocols().catch(err => {
          errors.push(`Protocols error: ${err.message}`);
          return [];
        }),
        optimizedDataService.getCardanoDexVolumes().catch(err => {
          errors.push(`DEX volumes error: ${err.message}`);
          return null;
        })
      ]);

      // Process results with better error handling
      const newData: Partial<OptimizedMarketData> = {
        lastUpdate: new Date(),
        isLoading: false,
        cacheStats: optimizedDataService.getCacheStats(),
        hasErrors: errors.length > 0,
        errorDetails: errors
      };

      // Process prices result with validation
      if (pricesResult.status === 'fulfilled') {
        const pricesValue = pricesResult.value;
        if (pricesValue && typeof pricesValue === 'object') {
          // Handle both direct price objects and wrapped responses
          if ('coins' in pricesValue) {
            newData.prices = pricesValue.coins || {};
          } else if (Array.isArray(pricesValue)) {
            // Convert array to lookup object
            const pricesMap: Record<string, any> = {};
            pricesValue.forEach((entry, index) => {
              const key = entry.pair || `entry_${index}`;
              pricesMap[key] = entry;
            });
            newData.prices = pricesMap;
          } else {
            newData.prices = pricesValue;
          }
          console.log('✅ Real prices loaded:', Object.keys(newData.prices).length, 'entries');
        } else {
          newData.prices = {};
          console.warn('⚠️ No price data available');
        }
      } else {
        console.error('❌ Error fetching prices:', pricesResult.reason);
        newData.prices = {};
        errors.push(`Prices fetch failed: ${pricesResult.reason}`);
      }

      // Process protocols result with validation
      if (protocolsResult.status === 'fulfilled') {
        newData.protocols = Array.isArray(protocolsResult.value) ? protocolsResult.value : [];
        console.log('✅ Protocols loaded:', newData.protocols.length, 'protocols');
      } else {
        console.error('❌ Error fetching protocols:', protocolsResult.reason);
        newData.protocols = [];
        errors.push(`Protocols fetch failed: ${protocolsResult.reason}`);
      }

      // Process DEX volumes result with validation
      if (volumesResult.status === 'fulfilled') {
        newData.dexVolumes = volumesResult.value;
        console.log('✅ DEX volumes loaded');
      } else {
        console.error('❌ Error fetching DEX volumes:', volumesResult.reason);
        newData.dexVolumes = null;
        errors.push(`DEX volumes fetch failed: ${volumesResult.reason}`);
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

      // Update final error state
      newData.hasErrors = errors.length > 0;
      newData.errorDetails = errors;

      setData(prev => ({ ...prev, ...newData }));
      
      console.log(`✅ Optimized data updated - Source: ${newData.dataSource}, Prices: ${Object.keys(newData.prices || {}).length}, Protocols: ${newData.protocols?.length || 0}, Errors: ${errors.length}`);

    } catch (error) {
      console.error('❌ Error in optimized data fetch:', error);
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
    cacheStats: data.cacheStats,
    hasErrors: data.hasErrors,
    errorDetails: data.errorDetails
  };
};
