
import { useEffect, useRef } from 'react';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { useArbitrageScanning } from './useArbitrageScanning';
import { useArbitrageExecution } from './useArbitrageExecution';
import { useArbitrageAutoScanning } from './useArbitrageAutoScanning';
import { useArbitrageOpportunityUtils } from './useArbitrageOpportunityUtils';
import { dataThrottlingService } from '@/services/dataThrottlingService';

export const useRealTimeArbitrage = () => {
  const isInitializedRef = useRef(false);
  const subscriptionRef = useRef<(() => void) | null>(null);

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

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Inicializando monitoreo optimizado de arbitraje...');
    
    const initializeServices = async () => {
      try {
        await realTimeMarketDataService.startRealTimeUpdates(90); // Aumentar intervalo a 90 segundos
        
        const unsubscribe = realTimeMarketDataService.subscribe((data) => {
          if (data.length > 0 && dataThrottlingService.canFetch('arbitrage')) {
            console.log('📊 Datos actualizados, programando escaneo...');
            // Usar timeout más largo para evitar bucles
            setTimeout(() => {
              if (!isScanning) {
                performRealScan();
              }
            }, 20000); // 20 segundos de delay
          }
        });

        subscriptionRef.current = unsubscribe;

        // Primer escaneo con delay más largo
        setTimeout(() => {
          if (dataThrottlingService.canFetch('arbitrage')) {
            performRealScan();
          }
        }, 10000); // 10 segundos inicial

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error inicializando servicios optimizados:', error);
        return () => {};
      }
    };

    initializeServices();

    return () => {
      console.log('🧹 Limpiando monitoreo optimizado de arbitraje...');
      cleanupAutoScanning();
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      dataThrottlingService.reset();
      isInitializedRef.current = false;
    };
  }, [cleanupAutoScanning, isScanning, performRealScan]);

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
