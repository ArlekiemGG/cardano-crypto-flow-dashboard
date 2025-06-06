
import { useState, useRef, useCallback } from 'react';

const AUTO_SCAN_INTERVAL = 60000;

export const useArbitrageAutoScanning = (performScan: () => Promise<void>) => {
  const [scanInterval, setScanInterval] = useState(60);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScanning = useCallback((intervalSeconds: number = 60) => {
    console.log(`🤖 Starting automatic arbitrage scanning every ${intervalSeconds} seconds`);
    setScanInterval(intervalSeconds);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    performScan();
    
    const actualInterval = Math.max(intervalSeconds * 1000, AUTO_SCAN_INTERVAL);
    scanIntervalRef.current = setInterval(performScan, actualInterval);
  }, [performScan]);

  const stopAutoScanning = useCallback(() => {
    console.log('🛑 Stopping automatic arbitrage scanning');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopAutoScanning();
  }, [stopAutoScanning]);

  return {
    scanInterval,
    startAutoScanning,
    stopAutoScanning,
    cleanup
  };
};
