
import { useState, useEffect, useRef } from 'react';
import { MarketData } from '@/types/trading';
import { marketDataStateManager } from '@/services/state/MarketDataStateManager';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';

export const useOptimizedMarketData = () => {
  const [state, setState] = useState(marketDataStateManager.getState());
  const subscriberIdRef = useRef<string>(`market-data-${Date.now()}-${Math.random()}`);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = marketDataStateManager.subscribe(
      subscriberIdRef.current,
      (newState) => setState({ ...newState })
    );

    const initializeService = async () => {
      if (isInitializedRef.current) return;
      
      isInitializedRef.current = true;
      marketDataStateManager.setLoading(true);

      try {
        await realTimeMarketDataService.initialize();
        
        const fetchData = () => {
          try {
            const prices = realTimeMarketDataService.getCurrentPrices();
            const connected = realTimeMarketDataService.isConnected();
            
            marketDataStateManager.updateMarketData(prices);
            marketDataStateManager.setConnectionStatus(connected);
          } catch (error) {
            console.error('Error fetching market data:', error);
            marketDataStateManager.setError('Failed to fetch market data');
          }
        };

        // Initial fetch
        fetchData();

        // Set up interval with reduced frequency
        const updateInterval = setInterval(fetchData, 30000); // 30 seconds

        // Cleanup function
        return () => {
          clearInterval(updateInterval);
          realTimeMarketDataService.cleanup();
        };

      } catch (error) {
        console.error('Error initializing market data service:', error);
        marketDataStateManager.setError('Failed to initialize market data service');
        marketDataStateManager.setLoading(false);
      }
    };

    const cleanup = initializeService();

    return () => {
      unsubscribe();
      if (cleanup) {
        Promise.resolve(cleanup).then(cleanupFn => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
      isInitializedRef.current = false;
    };
  }, []);

  const refreshData = async () => {
    try {
      marketDataStateManager.setLoading(true);
      const prices = realTimeMarketDataService.getCurrentPrices();
      marketDataStateManager.updateMarketData(prices);
      console.log('🔄 Manual data refresh completed');
    } catch (error) {
      console.error('Error refreshing market data:', error);
      marketDataStateManager.setError('Failed to refresh data');
    }
  };

  return {
    marketData: state.marketData,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    lastUpdate: state.lastUpdate,
    errorMessage: state.errorMessage,
    refreshData
  };
};
