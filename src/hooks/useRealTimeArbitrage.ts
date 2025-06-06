
import { useEffect, useRef } from 'react';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { useArbitrageScanning } from './useArbitrageScanning';
import { useArbitrageExecution } from './useArbitrageExecution';
import { useArbitrageAutoScanning } from './useArbitrageAutoScanning';
import { useArbitrageOpportunityUtils } from './useArbitrageOpportunityUtils';

export const useRealTimeArbitrage = () => {
  const isInitializedRef = useRef(false);

  // Use the smaller, focused hooks
  const {
    opportunities,
    stats,
    isScanning,
    lastScan,
    performRealScan
  } = useArbitrageScanning();

  const {
    executingTrades,
    executeArbitrage,
    simulateExecution,
    autoExecuteHighConfidence
  } = useArbitrageExecution(opportunities);

  const {
    scanInterval,
    startAutoScanning,
    stopAutoScanning,
    cleanup: cleanupAutoScanning
  } = useArbitrageAutoScanning(performRealScan);

  const opportunityUtils = useArbitrageOpportunityUtils(opportunities, stats);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing optimized real-time arbitrage monitoring...');
    
    const initializeServices = async () => {
      try {
        await realTimeMarketDataService.startRealTimeUpdates(60);
        
        const unsubscribe = realTimeMarketDataService.subscribe((data) => {
          if (data.length > 0) {
            console.log('📊 Market data updated, scheduling arbitrage rescan...');
            setTimeout(() => {
              if (!isScanning) {
                performRealScan();
              }
            }, 10000);
          }
        });

        setTimeout(() => {
          startAutoScanning(scanInterval);
        }, 15000);

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error initializing services:', error);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | null = null;
    
    initializeServices().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      console.log('🧹 Cleaning up real-time arbitrage monitoring...');
      cleanupAutoScanning();
      if (unsubscribe) {
        unsubscribe();
      }
      isInitializedRef.current = false;
    };
  }, []);

  return {
    opportunities,
    stats,
    isScanning,
    scanInterval,
    executingTrades,
    lastScan,
    
    performRealScan,
    performScan: performRealScan,
    executeArbitrage,
    simulateExecution,
    autoExecuteHighConfidence,
    startAutoScanning,
    startAutoScan: startAutoScanning,
    stopAutoScanning,
    stopAutoScan: stopAutoScanning,
    
    ...opportunityUtils
  };
};
