
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Minimum interval between scans to prevent overloading
const MIN_SCAN_INTERVAL = 15000; // 15 seconds

export const useArbitrageAutoScanning = (performScan: () => Promise<void>) => {
  const [scanInterval, setScanInterval] = useState(60);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScanning = useCallback((intervalSeconds: number = 60) => {
    console.log(`🤖 Starting automatic arbitrage scanning every ${intervalSeconds} seconds`);
    setScanInterval(intervalSeconds);
    setIsAutoScanning(true);
    
    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    // Run one scan immediately
    performScan().catch(err => {
      console.error('Error in initial scan:', err);
    });
    
    // Ensure interval is not too short to prevent overwhelming the system
    const actualInterval = Math.max(intervalSeconds * 1000, MIN_SCAN_INTERVAL);
    console.log(`⏱️ Setting auto-scan interval to ${actualInterval}ms`);
    
    // Set up regular scanning interval
    scanIntervalRef.current = setInterval(() => {
      console.log('⏰ Auto-scan interval triggered');
      performScan().catch(err => {
        console.error('Error in scheduled scan:', err);
      });
    }, actualInterval);
    
    // Notify user
    toast.success(`Auto scanning started, checking every ${intervalSeconds} seconds`, {
      duration: 3000
    });
  }, [performScan]);

  const stopAutoScanning = useCallback(() => {
    console.log('🛑 Stopping automatic arbitrage scanning');
    setIsAutoScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      
      // Notify user
      toast.info('Auto scanning stopped', {
        duration: 3000
      });
    }
  }, []);

  const cleanup = useCallback(() => {
    stopAutoScanning();
  }, [stopAutoScanning]);

  return {
    scanInterval,
    isAutoScanning,
    startAutoScanning,
    stopAutoScanning,
    cleanup
  };
};
