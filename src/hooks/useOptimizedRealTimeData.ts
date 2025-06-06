
import { useState, useEffect, useRef } from 'react';
import { realTimeWebSocketService } from '@/services/realTimeWebSocketService';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeDataConfig {
  enableWebSockets: boolean;
  pollInterval: number; // milliseconds
  websocketEndpoints: string[];
  maxCacheAge: number; // milliseconds
}

interface OptimizedRealTimeData {
  prices: Record<string, any>;
  dexVolumes: any[];
  arbitrageOpportunities: any[];
  connectionStatus: Record<string, boolean>;
  lastUpdate: Date;
  dataFreshness: number; // milliseconds since last update
}

const DEFAULT_CONFIG: RealTimeDataConfig = {
  enableWebSockets: true,
  pollInterval: 15000, // 15 seconds - optimized from 30
  websocketEndpoints: [], // Will be populated based on available DEXs
  maxCacheAge: 60000 // 1 minute
};

export const useOptimizedRealTimeData = (config: Partial<RealTimeDataConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [data, setData] = useState<OptimizedRealTimeData>({
    prices: {},
    dexVolumes: [],
    arbitrageOpportunities: [],
    connectionStatus: {},
    lastUpdate: new Date(),
    dataFreshness: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  // Optimized data fetching with intelligent caching
  const fetchOptimizedData = async (forceRefresh = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    // Skip if we fetched recently and not forcing refresh
    if (!forceRefresh && timeSinceLastFetch < finalConfig.pollInterval) {
      console.log(`⏭️ Skipping fetch, last update ${timeSinceLastFetch}ms ago`);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Fetching optimized real-time data...');
      
      // Parallel data fetching for better performance
      const [pricesResult, arbitrageResult, volumesResult] = await Promise.allSettled([
        fetchCachedMarketData(),
        fetchArbitrageOpportunities(),
        fetchDEXVolumes()
      ]);

      const newData: Partial<OptimizedRealTimeData> = {
        lastUpdate: new Date(),
        dataFreshness: 0
      };

      if (pricesResult.status === 'fulfilled') {
        newData.prices = pricesResult.value;
      }

      if (arbitrageResult.status === 'fulfilled') {
        newData.arbitrageOpportunities = arbitrageResult.value;
      }

      if (volumesResult.status === 'fulfilled') {
        newData.dexVolumes = volumesResult.value;
      }

      setData(prev => ({ ...prev, ...newData }));
      lastFetchRef.current = now;
      
      console.log(`✅ Real-time data updated successfully`);
      
    } catch (error) {
      console.error('❌ Error fetching optimized data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch cached market data with freshness validation
  const fetchCachedMarketData = async () => {
    const { data: cachedData, error } = await supabase
      .from('market_data_cache')
      .select('*')
      .gte('timestamp', new Date(Date.now() - finalConfig.maxCacheAge).toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const pricesMap: Record<string, any> = {};
    
    cachedData?.forEach(item => {
      if (!pricesMap[item.pair] || new Date(item.timestamp) > new Date(pricesMap[item.pair].timestamp)) {
        pricesMap[item.pair] = {
          price: Number(item.price),
          volume24h: Number(item.volume_24h) || 0,
          change24h: Number(item.change_24h) || 0,
          source: item.source_dex,
          timestamp: item.timestamp
        };
      }
    });

    return pricesMap;
  };

  const fetchArbitrageOpportunities = async () => {
    const { data, error } = await supabase
      .from('arbitrage_opportunities')
      .select('*')
      .eq('is_active', true)
      .order('profit_potential', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  };

  const fetchDEXVolumes = async () => {
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('source_dex, volume_24h')
      .not('volume_24h', 'is', null)
      .gte('timestamp', new Date(Date.now() - finalConfig.maxCacheAge).toISOString());

    if (error) throw error;

    const volumesByDex: Record<string, number> = {};
    data?.forEach(item => {
      const volume = Number(item.volume_24h) || 0;
      volumesByDex[item.source_dex] = (volumesByDex[item.source_dex] || 0) + volume;
    });

    return Object.entries(volumesByDex).map(([dex, volume]) => ({ dex, volume }));
  };

  // WebSocket connection management
  const setupWebSocketConnections = () => {
    if (!finalConfig.enableWebSockets) return;

    // Subscribe to real-time price updates
    const unsubscribePrice = realTimeWebSocketService.subscribe('price_updates', (message) => {
      if (message.type === 'price_update') {
        setData(prev => ({
          ...prev,
          prices: { ...prev.prices, ...message.data },
          lastUpdate: new Date(),
          dataFreshness: 0
        }));
      }
    });

    // Subscribe to arbitrage opportunities
    const unsubscribeArbitrage = realTimeWebSocketService.subscribe('arbitrage_updates', (message) => {
      if (message.type === 'arbitrage_opportunity') {
        setData(prev => ({
          ...prev,
          arbitrageOpportunities: [message.data, ...prev.arbitrageOpportunities.slice(0, 9)],
          lastUpdate: new Date(),
          dataFreshness: 0
        }));
      }
    });

    return () => {
      unsubscribePrice();
      unsubscribeArbitrage();
    };
  };

  // Trigger edge function for fresh data
  const triggerDataRefresh = async () => {
    try {
      console.log('🔄 Triggering edge function data refresh...');
      const { error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Edge function error:', error);
      } else {
        // Wait a bit then fetch the fresh data
        setTimeout(() => {
          fetchOptimizedData(true);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error triggering data refresh:', error);
    }
  };

  // Calculate data freshness
  useEffect(() => {
    const freshnessInterval = setInterval(() => {
      setData(prev => ({
        ...prev,
        dataFreshness: Date.now() - prev.lastUpdate.getTime()
      }));
    }, 1000);

    return () => clearInterval(freshnessInterval);
  }, []);

  // Main initialization and cleanup
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing optimized real-time data service...');
    
    // Initial data fetch
    fetchOptimizedData(true);

    // Setup periodic updates with optimized intervals
    intervalRef.current = setInterval(() => {
      fetchOptimizedData();
    }, finalConfig.pollInterval);

    // Setup WebSocket connections
    const cleanupWebSockets = setupWebSocketConnections();

    // Trigger edge function periodically for fresh data
    const edgeFunctionInterval = setInterval(() => {
      triggerDataRefresh();
    }, 60000); // Every minute

    return () => {
      console.log('🧹 Cleaning up optimized real-time data service...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      clearInterval(edgeFunctionInterval);
      
      if (cleanupWebSockets) {
        cleanupWebSockets();
      }
      
      realTimeWebSocketService.disconnectAll();
      isInitializedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    refresh: () => fetchOptimizedData(true),
    triggerRefresh: triggerDataRefresh,
    connectionStatus: data.connectionStatus,
    dataFreshness: data.dataFreshness
  };
};
