
import { useState, useEffect, useRef, useCallback } from 'react';
import { arbitrageEngine } from '@/services/arbitrageEngine';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';

interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitPercentage: number;
  profitADA: number;
  volumeAvailable: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  executionReady: boolean;
  slippageRisk: number;
  timestamp: string;
}

const SCAN_COOLDOWN = 30000; // 30 seconds minimum between scans
const AUTO_SCAN_INTERVAL = 60000; // 60 seconds for auto scanning

export const useOptimizedArbitrage = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date>(new Date());
  
  const lastScanRef = useRef<Date>(new Date());
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedScan = useCallback(async () => {
    const now = new Date();
    const timeSinceLastScan = now.getTime() - lastScanRef.current.getTime();
    
    if (timeSinceLastScan < SCAN_COOLDOWN || isScanning) {
      console.log('⏳ Scan debounced - too frequent or already scanning');
      return;
    }
    
    setIsScanning(true);
    lastScanRef.current = now;
    setLastScanTime(now);
    
    try {
      const realOpportunities = await arbitrageEngine.scanForArbitrageOpportunities();
      
      const formattedOpportunities: ArbitrageOpportunity[] = realOpportunities.map(opp => ({
        ...opp,
        executionReady: opp.confidence === 'HIGH' && opp.profitPercentage > 1.5 && opp.slippageRisk < 3
      }));

      setOpportunities(formattedOpportunities);
      console.log(`✅ Arbitrage scan completed: ${formattedOpportunities.length} opportunities`);
      
    } catch (error) {
      console.error('❌ Arbitrage scan error:', error);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const scheduleNextScan = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      debouncedScan();
    }, AUTO_SCAN_INTERVAL);
  }, [debouncedScan]);

  useEffect(() => {
    // Subscribe to market data updates
    const unsubscribe = realTimeMarketDataService.subscribe((data) => {
      if (data.length > 0) {
        scheduleNextScan();
      }
    });

    // Initial scan
    debouncedScan();

    return () => {
      unsubscribe();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [debouncedScan, scheduleNextScan]);

  return {
    opportunities,
    isScanning,
    lastScanTime,
    performScan: debouncedScan
  };
};
