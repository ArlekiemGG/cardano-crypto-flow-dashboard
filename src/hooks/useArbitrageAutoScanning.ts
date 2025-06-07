
import { useRef, useCallback } from 'react';

export const useArbitrageAutoScanning = (performScan: () => Promise<void>) => {
  const scanInterval = 60;
  const isAutoScanningRef = useRef(false);
  const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScanning = useCallback((interval: number) => {
    if (isAutoScanningRef.current) return;
    
    isAutoScanningRef.current = true;
    console.log(`🔄 Starting auto-scanning every ${interval} seconds`);
    
    autoScanIntervalRef.current = setInterval(() => {
      performScan().catch(console.error);
    }, interval * 1000);
  }, [performScan]);

  const stopAutoScanning = useCallback(() => {
    isAutoScanningRef.current = false;
    
    if (autoScanIntervalRef.current) {
      clearInterval(autoScanIntervalRef.current);
      autoScanIntervalRef.current = null;
    }
    
    console.log('⏹️ Auto-scanning stopped');
  }, []);

  const cleanup = useCallback(() => {
    stopAutoScanning();
  }, [stopAutoScanning]);

  return {
    scanInterval,
    isAutoScanning: isAutoScanningRef.current,
    startAutoScanning,
    stopAutoScanning,
    cleanup
  };
};
