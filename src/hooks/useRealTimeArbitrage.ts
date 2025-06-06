
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

    console.log('🧹 Ejecutando limpieza única del monitoreo de arbitraje...');
    
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
      console.log('⚠️ useRealTimeArbitrage ya inicializado, saltando...');
      return;
    }

    isInitializedRef.current = true;
    cleanupExecutedRef.current = false;

    console.log('🚀 Inicializando monitoreo de arbitraje ÚNICO...');
    
    const initializeServices = async () => {
      try {
        // Solo inicializar si el servicio no está activo
        if (!realTimeMarketDataService.isConnected()) {
          await realTimeMarketDataService.startRealTimeUpdates(60); // Intervalo más conservador
        }
        
        // Configurar suscripción única
        if (!subscriptionRef.current) {
          const unsubscribe = realTimeMarketDataService.subscribe((data) => {
            if (data.length > 0 && dataThrottlingService.canFetch('arbitrage')) {
              console.log('📊 Datos actualizados, programando escaneo...');
              
              // Throttle más agresivo para evitar escaneos duplicados
              setTimeout(() => {
                if (!isScanning && dataThrottlingService.canFetch('arbitrage')) {
                  performRealScan();
                }
              }, 10000); // 10 segundos de delay
            }
          });

          subscriptionRef.current = unsubscribe;
        }

        // Primer escaneo con delay mayor
        setTimeout(() => {
          if (dataThrottlingService.canFetch('arbitrage') && !isScanning) {
            console.log('🔍 Ejecutando primer escaneo inicial...');
            performRealScan();
          }
        }, 5000);

        // Monitor menos frecuente para evitar sobrecargar
        const throttlingMonitor = setInterval(() => {
          const status = dataThrottlingService.getThrottlingStatus();
          const canScanArbitrage = status.arbitrage?.canFetch;
          const currentPrices = realTimeMarketDataService.getCurrentPrices();
          
          if (canScanArbitrage && !isScanning && currentPrices.length > 0) {
            console.log('⚡ Escaneo programado por monitor (cada 60s)');
            performRealScan();
          }
        }, 60000); // Cada 60 segundos en lugar de 30

        return () => {
          clearInterval(throttlingMonitor);
          performCleanup();
        };

      } catch (error) {
        console.error('❌ Error inicializando servicios:', error);
        return performCleanup;
      }
    };

    const cleanup = initializeServices();

    return () => {
      console.log('🔄 Limpieza programada para useRealTimeArbitrage...');
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
      
      isInitializedRef.current = false;
      cleanupExecutedRef.current = false;
    };
  }, []); // Dependencias vacías para evitar re-ejecutar

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
