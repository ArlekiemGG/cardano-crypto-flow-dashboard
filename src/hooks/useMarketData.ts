
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
  const lastDataHash = useRef<string>('');

  // Create a hash of the data to prevent unnecessary updates
  const createDataHash = (data: MarketData[]): string => {
    return data.map(item => `${item.symbol}-${item.price}-${item.lastUpdate}`).join('|');
  };

  useEffect(() => {
    let isMounted = true;

    const initializeService = async () => {
      if (isInitializedRef.current) return;
      
      isInitializedRef.current = true;

      try {
        await realTimeMarketDataService.initialize();
        
        if (!isMounted) return;

        // Optimized data fetching with reduced frequency
        const fetchData = () => {
          if (!isMounted) return;
          
          const prices = realTimeMarketDataService.getCurrentPrices();
          const connected = realTimeMarketDataService.isConnected();
          
          // Only update if data has actually changed
          const newDataHash = createDataHash(prices);
          if (newDataHash !== lastDataHash.current) {
            lastDataHash.current = newDataHash;
            setMarketData([...prices]); // Create new array reference
            setLastUpdate(new Date());
            
            // Log only significant updates
            if (prices.length > 0) {
              console.log(`📊 Market data updated: ${prices.length} entries`);
            }
          }
          
          setIsConnected(connected);
          setIsLoading(false);
        };

        // Initial fetch
        fetchData();

        // Reduced update frequency
        const updateInterval = setInterval(fetchData, 30000); // Every 30 seconds instead of 10

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

    return () => {
      isMounted = false;
      console.log('🧹 Cleaning up useMarketData...');
      
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      isInitializedRef.current = false;
      lastDataHash.current = '';
    };
  }, []);

  // Optimized manual refresh function
  const refreshData = async () => {
    try {
      const prices = realTimeMarketDataService.getCurrentPrices();
      const newDataHash = createDataHash(prices);
      
      if (newDataHash !== lastDataHash.current) {
        lastDataHash.current = newDataHash;
        setMarketData([...prices]);
        setLastUpdate(new Date());
        console.log('🔄 Manual data refresh completed');
      }
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
