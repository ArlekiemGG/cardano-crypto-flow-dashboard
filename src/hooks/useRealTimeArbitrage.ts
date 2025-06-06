
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

    console.log('🚀 Inicializando monitoreo optimizado de arbitraje v2...');
    
    const initializeServices = async () => {
      try {
        // Iniciar con intervalo más agresivo (45s en lugar de 90s)
        await realTimeMarketDataService.startRealTimeUpdates(45);
        
        const unsubscribe = realTimeMarketDataService.subscribe((data) => {
          if (data.length > 0 && dataThrottlingService.canFetch('arbitrage')) {
            console.log('📊 Datos actualizados, iniciando escaneo optimizado...');
            // Reducir delay para respuesta más rápida
            setTimeout(() => {
              if (!isScanning) {
                performRealScan();
              }
            }, 5000); // Reducido de 20s a 5s
          }
        });

        subscriptionRef.current = unsubscribe;

        // Primer escaneo más rápido
        setTimeout(() => {
          if (dataThrottlingService.canFetch('arbitrage')) {
            performRealScan();
          }
        }, 3000); // Reducido de 10s a 3s

        // Monitoreo periódico del estado de throttling
        const throttlingMonitor = setInterval(() => {
          const status = dataThrottlingService.getThrottlingStatus();
          const canScanArbitrage = status.arbitrage?.canFetch;
          
          if (canScanArbitrage && !isScanning && data.length > 0) {
            console.log('⚡ Oportunidad de escaneo detectada por monitor');
            performRealScan();
          }
        }, 30000); // Check cada 30s

        return () => {
          unsubscribe();
          clearInterval(throttlingMonitor);
        };

      } catch (error) {
        console.error('❌ Error inicializando servicios optimizados v2:', error);
        return () => {};
      }
    };

    initializeServices();

    return () => {
      console.log('🧹 Limpiando monitoreo optimizado de arbitraje v2...');
      cleanupAutoScanning();
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
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
