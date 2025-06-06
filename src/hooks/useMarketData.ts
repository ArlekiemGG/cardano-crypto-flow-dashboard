
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketData, ArbitrageOpportunity } from '@/types/trading';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const channelRef = useRef<any>(null);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching market data from database...');
      
      // Fetch recent data from cache (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: cachedData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', thirtyMinutesAgo)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error fetching market data:', error);
        setIsConnected(false);
        return;
      }

      if (cachedData && cachedData.length > 0) {
        // Process and organize data
        const processedData: MarketData[] = [];
        const pairMap = new Map<string, any>();
        
        cachedData.forEach(item => {
          if (!pairMap.has(item.pair) || new Date(item.timestamp) > new Date(pairMap.get(item.pair).timestamp)) {
            pairMap.set(item.pair, item);
          }
        });

        // Convert to MarketData format
        pairMap.forEach((item, pair) => {
          if (pair.includes('ADA') || pair.includes('CARDANO') || pair.toLowerCase().includes('cardano')) {
            const symbol = pair.includes('ADA/USD') ? 'ADA' : 
                          pair.includes('CARDANO') ? 'ADA' : 
                          pair.split('/')[0];
            
            processedData.push({
              symbol,
              price: Number(item.price) || 0,
              change24h: Number(item.change_24h) || 0,
              volume24h: Number(item.volume_24h) || 0,
              marketCap: Number(item.market_cap) || 0,
              lastUpdate: item.timestamp
            });
          }
        });

        if (processedData.length > 0) {
          setMarketData(processedData);
          setIsConnected(true);
          console.log(`✅ Market data loaded: ${processedData.length} items`);
        } else {
          console.log('⚠️ No relevant market data found, triggering refresh...');
          triggerDataRefresh();
        }
      } else {
        console.log('📊 No cached data found, triggering edge function...');
        await triggerDataRefresh();
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error in fetchMarketData:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDataRefresh = async () => {
    try {
      console.log('🔄 Triggering data refresh via edge function...');
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Edge function error:', error);
      } else {
        console.log('✅ Edge function completed:', data);
        // Wait a bit and then fetch the updated data
        setTimeout(() => {
          fetchMarketData();
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error triggering data refresh:', error);
    }
  };

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('useMarketData already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing market data service...');
    isInitializedRef.current = true;
    
    // Initial fetch
    fetchMarketData();

    // Set up periodic updates every 2 minutes
    intervalRef.current = setInterval(() => {
      console.log('🔄 Periodic market data refresh...');
      fetchMarketData();
    }, 120000);

    // Clean up any existing channel
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error cleaning up existing channel:', error);
      }
    }

    // Set up real-time subscription for cache updates
    channelRef.current = supabase
      .channel(`market_data_changes_${Date.now()}`) // Unique channel name
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'market_data_cache' 
        }, 
        (payload) => {
          console.log('📊 Real-time market data update:', payload);
          // Debounce the refresh to avoid too many updates
          setTimeout(() => {
            fetchMarketData();
          }, 1000);
        }
      );

    // Subscribe to the channel
    channelRef.current.subscribe((status: string) => {
      console.log('📊 Subscription status:', status);
    });

    return () => {
      console.log('🧹 useMarketData cleanup initiated...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (error) {
          console.error('Error cleaning up channel:', error);
        }
      }
      
      isInitializedRef.current = false;
      console.log('✅ useMarketData cleanup completed');
    };
  }, []);

  return {
    marketData,
    arbitrageOpportunities,
    isLoading,
    isConnected,
    lastUpdate,
    refetch: fetchMarketData,
    triggerRefresh: triggerDataRefresh
  };
};
