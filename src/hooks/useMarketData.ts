
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
      console.log('📊 Fetching REAL market data from database...');
      
      // Get fresh data from the last 15 minutes to ensure real-time accuracy
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: cachedData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', fifteenMinutesAgo)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error fetching real market data:', error);
        setIsConnected(false);
        return;
      }

      if (cachedData && cachedData.length > 0) {
        console.log(`📊 Processing ${cachedData.length} real data entries...`);
        
        // Process real market data with priority for external APIs
        const processedData: MarketData[] = [];
        const seenPairs = new Map<string, any>();

        // Sort by data quality: CoinGecko > DeFiLlama > others
        const sortedData = cachedData.sort((a, b) => {
          const sourceRanking = (source: string) => {
            if (source === 'CoinGecko') return 3;
            if (source === 'DeFiLlama') return 2;
            return 1;
          };
          return sourceRanking(b.source_dex) - sourceRanking(a.source_dex);
        });

        sortedData.forEach((item) => {
          // Process ADA data specifically with real validation
          if (item.pair && (item.pair.includes('ADA') || item.pair.includes('CARDANO')) && item.price > 0) {
            const pairKey = 'ADA'; // Normalize to ADA
            
            // Only accept real price data (not mock $1.0000)
            if (item.price !== 1 && item.price > 0.1 && item.price < 10) {
              const existing = seenPairs.get(pairKey);
              
              // Use the most recent and reliable data
              if (!existing || 
                  new Date(item.timestamp) > new Date(existing.timestamp) ||
                  (item.source_dex === 'CoinGecko' && existing.source_dex !== 'CoinGecko')) {
                
                seenPairs.set(pairKey, {
                  symbol: 'ADA',
                  price: Number(item.price),
                  change24h: Number(item.change_24h) || 0,
                  volume24h: Number(item.volume_24h) || 0,
                  marketCap: Number(item.market_cap) || 0,
                  lastUpdate: item.timestamp,
                  source: item.source_dex
                });
              }
            }
          }
        });

        // Convert map to array
        const finalData = Array.from(seenPairs.values());
        
        if (finalData.length > 0) {
          setMarketData(finalData);
          setIsConnected(true);
          console.log(`✅ REAL market data loaded:`, finalData);
        } else {
          console.log('⚠️ No valid real market data found, triggering refresh...');
          await triggerDataRefresh();
        }
      } else {
        console.log('📊 No recent data found, triggering edge function...');
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
      console.log('🔄 Triggering REAL data refresh via edge function...');
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Edge function error:', error);
      } else {
        console.log('✅ Real data refresh completed:', data);
        // Wait for fresh data and then fetch
        setTimeout(() => {
          fetchMarketData();
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error triggering real data refresh:', error);
    }
  };

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('useMarketData already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing REAL market data service...');
    isInitializedRef.current = true;
    
    // Initial fetch of real data
    fetchMarketData();

    // Set up periodic updates every 3 minutes for real-time data
    intervalRef.current = setInterval(() => {
      console.log('🔄 Periodic REAL market data refresh...');
      fetchMarketData();
    }, 180000);

    // Clean up any existing channel
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error cleaning up existing channel:', error);
      }
    }

    // Set up real-time subscription for fresh data updates
    channelRef.current = supabase
      .channel(`real_market_data_${Date.now()}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'market_data_cache' 
        }, 
        (payload) => {
          console.log('📊 Real-time market data update received:', payload);
          // Debounce the refresh to avoid too many updates
          setTimeout(() => {
            fetchMarketData();
          }, 2000);
        }
      );

    // Subscribe to the channel
    channelRef.current.subscribe((status: string) => {
      console.log('📊 Real-time subscription status:', status);
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
