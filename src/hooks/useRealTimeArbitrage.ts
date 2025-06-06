
import { useState, useEffect, useRef } from 'react';
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
  totalFees: number;
  netProfit: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timeToExpiry: number;
  slippageRisk: number;
  liquidityScore: number;
  timestamp: string;
}

interface ArbitrageStats {
  totalOpportunities: number;
  avgProfitPercentage: number;
  successRate: number;
  totalVolume: number;
}

export const useRealTimeArbitrage = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [stats, setStats] = useState<ArbitrageStats>({
    totalOpportunities: 0,
    avgProfitPercentage: 0,
    successRate: 0,
    totalVolume: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date>(new Date());
  const [scanInterval, setScanInterval] = useState(30); // seconds
  
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  const performScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    console.log('🔍 Starting arbitrage scan...');
    
    try {
      const foundOpportunities = await arbitrageEngine.scanForArbitrageOpportunities();
      setOpportunities(foundOpportunities);
      setLastScan(new Date());
      
      // Update stats
      const performance = await arbitrageEngine.getArbitragePerformance(7);
      setStats(performance);
      
      console.log(`✅ Arbitrage scan completed: ${foundOpportunities.length} opportunities found`);
    } catch (error) {
      console.error('❌ Error during arbitrage scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const startAutoScan = (intervalSeconds: number = 30) => {
    console.log(`🤖 Starting automatic arbitrage scanning every ${intervalSeconds} seconds`);
    setScanInterval(intervalSeconds);
    
    // Clear existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    // Initial scan
    performScan();
    
    // Set up recurring scans
    scanIntervalRef.current = setInterval(performScan, intervalSeconds * 1000);
  };

  const stopAutoScan = () => {
    console.log('🛑 Stopping automatic arbitrage scanning');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const simulateExecution = async (opportunityId: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) return null;

    console.log(`🧪 Simulating execution for opportunity ${opportunityId}`);
    return await arbitrageEngine.simulateTradeExecution(opportunity);
  };

  // Filter opportunities by criteria
  const getFilteredOpportunities = (
    minProfit: number = 0,
    maxSlippage: number = 10,
    minConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  ) => {
    const confidenceScores = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const minConfidenceScore = confidenceScores[minConfidence];

    return opportunities.filter(opp => 
      opp.profitPercentage >= minProfit &&
      opp.slippageRisk <= maxSlippage &&
      confidenceScores[opp.confidence] >= minConfidenceScore
    );
  };

  // Get opportunities by pair
  const getOpportunitiesByPair = (pair: string) => {
    return opportunities.filter(opp => 
      opp.pair.toLowerCase().includes(pair.toLowerCase())
    );
  };

  // Get top opportunities by profit
  const getTopOpportunities = (limit: number = 5) => {
    return opportunities
      .sort((a, b) => b.profitADA - a.profitADA)
      .slice(0, limit);
  };

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log('🚀 Initializing real-time arbitrage monitoring...');
    
    // Start market data service
    realTimeMarketDataService.startRealTimeUpdates(30);
    
    // Start auto-scanning after a short delay
    setTimeout(() => {
      startAutoScan(scanInterval);
    }, 5000);

    // Subscribe to market data updates to trigger rescans
    const unsubscribe = realTimeMarketDataService.subscribe(() => {
      console.log('📊 Market data updated, triggering arbitrage rescan...');
      performScan();
    });

    return () => {
      console.log('🧹 Cleaning up arbitrage monitoring...');
      stopAutoScan();
      realTimeMarketDataService.stopRealTimeUpdates();
      unsubscribe();
      isInitialized.current = false;
    };
  }, []);

  return {
    // State
    opportunities,
    stats,
    isScanning,
    lastScan,
    scanInterval,
    
    // Actions
    performScan,
    startAutoScan,
    stopAutoScan,
    simulateExecution,
    
    // Filtering and data access
    getFilteredOpportunities,
    getOpportunitiesByPair,
    getTopOpportunities,
    
    // Quick stats
    totalOpportunities: opportunities.length,
    highConfidenceOpportunities: opportunities.filter(opp => opp.confidence === 'HIGH').length,
    avgProfitPercentage: opportunities.length > 0 
      ? opportunities.reduce((sum, opp) => sum + opp.profitPercentage, 0) / opportunities.length 
      : 0,
    totalPotentialProfit: opportunities.reduce((sum, opp) => sum + opp.profitADA, 0)
  };
};
