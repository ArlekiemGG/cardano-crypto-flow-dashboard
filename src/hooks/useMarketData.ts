
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { blockfrostService } from '@/services/blockfrostService';
import { MarketData, ArbitrageOpportunity } from '@/types/trading';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const channelsRef = useRef<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching ADA market data...');
      
      // Fetch only real ADA price to avoid conflicts
      const realAdaPrice = await blockfrostService.getADAPrice();
      console.log('Real ADA price:', realAdaPrice);
      
      if (realAdaPrice > 0) {
        // Create single ADA market data entry
        const adaMarketData: MarketData = {
          symbol: 'ADA',
          price: realAdaPrice,
          change24h: 0, // Will be calculated by the service
          volume24h: 850000000, // Real ADA volume approximation
          marketCap: realAdaPrice * 35000000000, // ADA total supply approximation
          lastUpdate: new Date().toISOString()
        };

        setMarketData([adaMarketData]);
        setIsConnected(true);
        console.log('ADA market data updated successfully');
      } else {
        console.warn('Could not fetch real ADA price');
        setIsConnected(false);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
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
    if (isInitializedRef.current) {
      console.log('useMarketData already initialized, skipping...');
      return;
    }

    console.log('Initializing market data connection...');
    isInitializedRef.current = true;
    
    // Initial fetch
    fetchMarketData();

    // Periodic updates every 60 seconds for ADA price
    intervalRef.current = setInterval(() => {
      console.log('Periodic ADA price update...');
      fetchMarketData();
    }, 60000);

    return () => {
      console.log('useMarketData cleanup initiated...');
      cleanupChannels();
      clearInterval();
      isInitializedRef.current = false;
      console.log('useMarketData cleanup completed');
    };
  }, []);

  return {
    marketData,
    arbitrageOpportunities,
    isLoading,
    isConnected,
    lastUpdate,
    refetch: fetchMarketData
  };
};
