
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

    console.log('🚀 Inicializando monitoreo de arbitraje REAL (sin datos simulados)...');
    
    const initializeServices = async () => {
      try {
        // Forzar reset de throttling para testing
        dataThrottlingService.forceReset();
        
        await realTimeMarketDataService.startRealTimeUpdates(60); // 60 segundos
        
        const unsubscribe = realTimeMarketDataService.subscribe((data) => {
          if (data.length > 0) {
            console.log('📊 Datos de mercado actualizados, programando escaneo...');
            setTimeout(() => {
              if (!isScanning) {
                console.log('🔍 Ejecutando escaneo automático de datos reales...');
                performRealScan();
              }
            }, 5000); // 5 segundos de delay
          }
        });

        subscriptionRef.current = unsubscribe;

        // Primer escaneo inmediato
        console.log('🔍 Ejecutando primer escaneo de datos reales...');
        setTimeout(() => {
          performRealScan();
        }, 2000); // 2 segundos inicial

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error inicializando servicios:', error);
        return () => {};
      }
    };

    initializeServices();

    return () => {
      console.log('🧹 Limpiando monitoreo de arbitraje...');
      cleanupAutoScanning();
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [cleanupAutoScanning, isScanning, performRealScan]);

  // Función de escaneo manual mejorada
  const performManualScan = async () => {
    console.log('🔍 ESCANEO MANUAL INICIADO - Solo datos reales...');
    dataThrottlingService.forceReset('arbitrage');
    dataThrottlingService.forceReset('marketData');
    
    try {
      await performRealScan();
      console.log('✅ Escaneo manual completado (solo datos reales)');
    } catch (error) {
      console.error('❌ Error en escaneo manual:', error);
    }
  };

  return {
    opportunities,
    stats,
    isScanning,
    scanInterval,
    isAutoScanning,
    executingTrades,
    lastScan,
    
    performRealScan: performManualScan, // Usar la versión mejorada
    performScan: performManualScan,
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
