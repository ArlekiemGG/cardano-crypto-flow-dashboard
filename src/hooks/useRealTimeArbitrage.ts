
import { useEffect, useRef, useCallback } from 'react';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { useArbitrageScanning } from './useArbitrageScanning';
import { useArbitrageExecution } from './useArbitrageExecution';
import { useArbitrageAutoScanning } from './useArbitrageAutoScanning';
import { useArbitrageOpportunityUtils } from './useArbitrageOpportunityUtils';
import { dataThrottlingService } from '@/services/dataThrottlingService';

export const useRealTimeArbitrage = () => {
  const isInitializedRef = useRef(false);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const cleanupExecutedRef = useRef(false);
  const lastTriggerTime = useRef(0);
  const isProcessingRef = useRef(false);

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
    isAutoScanning,
    startAutoScanning,
    stopAutoScanning,
    cleanup: cleanupAutoScanning
  } = useArbitrageAutoScanning(performRealScan);

  const opportunityUtils = useArbitrageOpportunityUtils(opportunities, stats);

  // Throttled scan function to prevent excessive calls
  const throttledScan = useCallback(() => {
    const now = Date.now();
    const THROTTLE_INTERVAL = 60000; // 1 minute minimum between scans
    
    if (now - lastTriggerTime.current < THROTTLE_INTERVAL || 
        isProcessingRef.current || 
        isScanning || 
        !dataThrottlingService.canFetch('arbitrage')) {
      return;
    }
    
    lastTriggerTime.current = now;
    isProcessingRef.current = true;
    
    console.log('🎯 Triggering throttled arbitrage scan...');
    
    setTimeout(() => {
      if (dataThrottlingService.canFetch('arbitrage') && !isScanning) {
        performRealScan().finally(() => {
          isProcessingRef.current = false;
        });
      } else {
        isProcessingRef.current = false;
      }
    }, 2000);
  }, [performRealScan, isScanning]);

  // Centralized cleanup function
  const performCleanup = useCallback(() => {
    if (cleanupExecutedRef.current) return;
    cleanupExecutedRef.current = true;

    console.log('🧹 Executing arbitrage cleanup...');
    
    try {
      cleanupAutoScanning();
      
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      
      // Reset all refs
      isInitializedRef.current = false;
      lastTriggerTime.current = 0;
      isProcessingRef.current = false;
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [cleanupAutoScanning]);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;
    cleanupExecutedRef.current = false;

    console.log('🚀 Initializing optimized arbitrage monitoring...');
    
    const initializeServices = async (): Promise<(() => void) | undefined> => {
      try {
        // Initialize market data service with increased interval
        if (!realTimeMarketDataService.isConnected()) {
          await realTimeMarketDataService.startRealTimeUpdates(90); // Increased to 90 seconds
        }
        
        // Set up subscription with debouncing
        if (!subscriptionRef.current) {
          const unsubscribe = realTimeMarketDataService.subscribe((data) => {
            if (data.length > 5) { // Only trigger if we have substantial data
              throttledScan();
            }
          });

          subscriptionRef.current = unsubscribe;
        }

        // Initial scan with longer delay
        setTimeout(() => {
          if (dataThrottlingService.canFetch('arbitrage') && !isScanning && !isProcessingRef.current) {
            throttledScan();
          }
        }, 8000); // Increased delay

        return () => {
          performCleanup();
        };

      } catch (error) {
        console.error('❌ Error initializing services:', error);
        return performCleanup;
      }
    };

    let cleanupFunction: (() => void) | undefined;

    initializeServices().then((cleanup) => {
      cleanupFunction = cleanup;
    }).catch((error) => {
      console.error('Error initializing services:', error);
    });

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
      
      // Ensure cleanup is called
      performCleanup();
    };
  }, [performRealScan, isScanning, cleanupAutoScanning, performCleanup, throttledScan]);

  return {
    opportunities,
    stats,
    isScanning,
    scanInterval,
    isAutoScanning,
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
