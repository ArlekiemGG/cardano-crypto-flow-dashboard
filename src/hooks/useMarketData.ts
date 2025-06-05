
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { dexService } from '@/services/dexService';
import { blockfrostService } from '@/services/blockfrostService';
import { MarketData, ArbitrageOpportunity } from '@/types/trading';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Use refs to track channels and prevent duplicates
  const channelsRef = useRef<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching real market data from Cardano DEXs...');
      
      // Fetch real ADA price
      const realAdaPrice = await blockfrostService.getADAPrice();
      console.log('Real ADA price:', realAdaPrice);
      
      // Update market data using edge function
      await dexService.updateMarketData();
      
      setIsConnected(true);

      // Fetch cached market data from database
      const { data: cachedData, error: cacheError } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false });

      if (cacheError) {
        console.error('Error fetching cached data:', cacheError);
      } else if (cachedData && cachedData.length > 0) {
        console.log(`Loaded ${cachedData.length} cached price entries`);
        
        // Process and deduplicate market data
        const uniquePairs = new Map<string, any>();
        
        cachedData.forEach(item => {
          const key = item.pair;
          if (!uniquePairs.has(key) || new Date(item.timestamp) > new Date(uniquePairs.get(key).timestamp)) {
            uniquePairs.set(key, item);
          }
        });

        const formattedData: MarketData[] = Array.from(uniquePairs.values()).map(item => ({
          symbol: item.pair.split('/')[0],
          price: realAdaPrice && item.pair.includes('ADA') ? realAdaPrice : Number(item.price),
          change24h: Number(item.change_24h) || 0,
          volume24h: Number(item.volume_24h) || 0,
          marketCap: Number(item.market_cap) || 0,
          lastUpdate: item.timestamp || new Date().toISOString()
        }));

        setMarketData(formattedData);
        console.log(`Processed ${formattedData.length} unique market data entries`);
      }

      // Fetch arbitrage opportunities using the updated service
      const opportunities = await dexService.detectRealArbitrage();
      setArbitrageOpportunities(opportunities);
      console.log(`Found ${opportunities.length} arbitrage opportunities`);

      setLastUpdate(new Date());
      console.log('Real market data fetch completed successfully');
    } catch (error) {
      console.error('Error fetching real market data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupChannels = () => {
    console.log(`Cleaning up ${channelsRef.current.length} channels...`);
    channelsRef.current.forEach(channel => {
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error cleaning up channel:', error);
      }
    });
    channelsRef.current = [];
  };

  const clearInterval = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log('useMarketData already initialized, skipping...');
      return;
    }

    console.log('Initializing real-time DEX data connection...');
    isInitializedRef.current = true;
    
    // Initial fetch
    fetchMarketData();

    // Create unique channel names with timestamp and random suffix to avoid conflicts
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const marketChannelName = `market-data-${timestamp}-${randomId}`;
    const arbitrageChannelName = `arbitrage-${timestamp}-${randomId}`;

    console.log(`Creating channels: ${marketChannelName}, ${arbitrageChannelName}`);

    // Set up real-time subscriptions with unique channel names
    const marketDataChannel = supabase
      .channel(marketChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_data_cache'
        },
        () => {
          console.log('Market data updated via realtime, refetching...');
          fetchMarketData();
        }
      )
      .subscribe();

    const arbitrageChannel = supabase
      .channel(arbitrageChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arbitrage_opportunities'
        },
        () => {
          console.log('Arbitrage opportunities updated via realtime, refetching...');
          fetchMarketData();
        }
      )
      .subscribe();

    // Store channels for cleanup
    channelsRef.current = [marketDataChannel, arbitrageChannel];

    // Periodic updates every 60 seconds for real-time data
    intervalRef.current = setInterval(() => {
      console.log('Periodic real market data update...');
      fetchMarketData();
    }, 60000);

    return () => {
      console.log('useMarketData cleanup initiated...');
      cleanupChannels();
      clearInterval();
      isInitializedRef.current = false;
      console.log('useMarketData cleanup completed');
    };
  }, []); // Empty dependency array to ensure this only runs once

  return {
    marketData,
    arbitrageOpportunities,
    isLoading,
    isConnected,
    lastUpdate,
    refetch: fetchMarketData
  };
};
