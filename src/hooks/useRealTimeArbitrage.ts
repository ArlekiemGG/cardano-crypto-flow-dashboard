
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

  // Función de limpieza centralizada
  const performCleanup = useCallback(() => {
    if (cleanupExecutedRef.current) return;
    cleanupExecutedRef.current = true;

    console.log('🧹 Ejecutando limpieza de arbitraje...');
    
    try {
      cleanupAutoScanning();
      
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    } catch (error) {
      console.error('Error durante limpieza:', error);
    }
  }, [cleanupAutoScanning]);

  useEffect(() => {
    // Prevenir múltiples inicializaciones
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;
    cleanupExecutedRef.current = false;

    console.log('🚀 Inicializando monitoreo de arbitraje...');
    
    const initializeServices = async (): Promise<(() => void) | undefined> => {
      try {
        // Solo inicializar si el servicio no está activo
        if (!realTimeMarketDataService.isConnected()) {
          await realTimeMarketDataService.startRealTimeUpdates(45);
        }
        
        // Configurar suscripción única
        if (!subscriptionRef.current) {
          const unsubscribe = realTimeMarketDataService.subscribe((data) => {
            if (data.length > 0 && dataThrottlingService.canFetch('arbitrage')) {
              setTimeout(() => {
                if (!isScanning && dataThrottlingService.canFetch('arbitrage')) {
                  performRealScan();
                }
              }, 5000);
            }
          });

          subscriptionRef.current = unsubscribe;
        }

        // Primer escaneo con delay
        setTimeout(() => {
          if (dataThrottlingService.canFetch('arbitrage') && !isScanning) {
            performRealScan();
          }
        }, 3000);

        return () => {
          performCleanup();
        };

      } catch (error) {
        console.error('❌ Error inicializando servicios:', error);
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
      
      isInitializedRef.current = false;
      cleanupExecutedRef.current = false;
    };
  }, [performRealScan, isScanning, cleanupAutoScanning, performCleanup]);

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
