
import { useState, useEffect, useRef } from 'react';
import { MarketData } from '@/types/trading';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<any[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initializeService = async () => {
      if (isInitializedRef.current) return;
      
      console.log('🚀 Initializing market data service...');
      isInitializedRef.current = true;

      try {
        await realTimeMarketDataService.initialize();
        
        if (!isMounted) return;

        // Set up periodic data fetching
        const fetchData = () => {
          if (!isMounted) return;
          
          const prices = realTimeMarketDataService.getCurrentPrices();
          const connected = realTimeMarketDataService.isConnected();
          
          setMarketData(prices);
          setIsConnected(connected);
          setIsLoading(false);
          setLastUpdate(new Date());
        };

        // Initial fetch
        fetchData();

        // Set up interval for updates
        const updateInterval = setInterval(fetchData, 10000); // Every 10 seconds

        // Store cleanup function
        cleanupRef.current = () => {
          clearInterval(updateInterval);
          realTimeMarketDataService.cleanup();
        };

      } catch (error) {
        console.error('Error initializing market data:', error);
        if (isMounted) {
          setIsConnected(false);
          setIsLoading(false);
        }
      }
    };

    initializeService();

    // Modern cleanup using AbortController pattern
    return () => {
      isMounted = false;
      console.log('🧹 Cleaning up useMarketData...');
      
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      isInitializedRef.current = false;
      console.log('✅ Cleanup completed');
    };
  }, []);

  // Provide manual refresh function
  const refreshData = async () => {
    try {
      const prices = realTimeMarketDataService.getCurrentPrices();
      setMarketData(prices);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing market data:', error);
    }
  };

  return {
    marketData,
    isConnected,
    isLoading,
    lastUpdate,
    arbitrageOpportunities,
    refreshData
  };
};
