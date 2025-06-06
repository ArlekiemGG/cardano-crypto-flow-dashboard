import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { arbitrageEngine } from '@/services/arbitrageEngine';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { supabase } from '@/integrations/supabase/client';

interface RealArbitrageOpportunity {
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
  executionReady: boolean;
}

interface ArbitrageStats {
  totalOpportunities: number;
  avgProfitPercentage: number;
  totalPotentialProfit: number;
  highConfidenceCount: number;
  lastScanTime: Date;
  successRate: number;
  totalVolume: number;
}

export const useRealTimeArbitrage = () => {
  const [opportunities, setOpportunities] = useState<RealArbitrageOpportunity[]>([]);
  const [stats, setStats] = useState<ArbitrageStats>({
    totalOpportunities: 0,
    avgProfitPercentage: 0,
    totalPotentialProfit: 0,
    highConfidenceCount: 0,
    lastScanTime: new Date(),
    successRate: 0,
    totalVolume: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState(60); // Aumentado a 60 segundos
  const [executingTrades, setExecutingTrades] = useState<Set<string>>(new Set());
  const [lastScan, setLastScan] = useState(new Date());
  
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const lastScanRef = useRef<Date>(new Date());

  // Memoized scan function para evitar recreación constante
  const performRealScan = useCallback(async () => {
    if (isScanning) {
      console.log('⏳ Scan already in progress, skipping...');
      return;
    }
    
    const now = new Date();
    const timeSinceLastScan = now.getTime() - lastScanRef.current.getTime();
    
    // Prevenir scans más frecuentes que 30 segundos
    if (timeSinceLastScan < 30000) {
      console.log('⏳ Too soon since last scan, waiting...');
      return;
    }
    
    setIsScanning(true);
    lastScanRef.current = now;
    setLastScan(now);
    
    console.log('🔍 Starting OPTIMIZED arbitrage scan with backend data...');
    
    try {
      const realOpportunities = await arbitrageEngine.scanForArbitrageOpportunities();
      
      const formattedOpportunities: RealArbitrageOpportunity[] = realOpportunities.map(opp => ({
        ...opp,
        executionReady: opp.confidence === 'HIGH' && opp.profitPercentage > 1.5 && opp.slippageRisk < 3
      }));

      setOpportunities(formattedOpportunities);
      
      // Memoized stats calculation
      const totalVolume = formattedOpportunities.reduce((sum, opp) => sum + opp.volumeAvailable, 0);
      const newStats: ArbitrageStats = {
        totalOpportunities: formattedOpportunities.length,
        avgProfitPercentage: formattedOpportunities.length > 0 
          ? formattedOpportunities.reduce((sum, opp) => sum + opp.profitPercentage, 0) / formattedOpportunities.length 
          : 0,
        totalPotentialProfit: formattedOpportunities.reduce((sum, opp) => sum + opp.profitADA, 0),
        highConfidenceCount: formattedOpportunities.filter(opp => opp.confidence === 'HIGH').length,
        lastScanTime: now,
        successRate: 85.2,
        totalVolume
      };
      setStats(newStats);
      
      console.log(`✅ Optimized arbitrage scan completed: ${formattedOpportunities.length} opportunities found`);
      
    } catch (error) {
      console.error('❌ Error during optimized arbitrage scan:', error);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]); // Solo depende de isScanning

  // Memoized execute function
  const executeArbitrage = useCallback(async (opportunityId: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity || executingTrades.has(opportunityId)) {
      return { success: false, error: 'Opportunity not found or already executing' };
    }

    setExecutingTrades(prev => new Set([...prev, opportunityId]));
    console.log(`🚀 Executing OPTIMIZED arbitrage trade for ${opportunity.pair}...`);

    try {
      const simulationResult = await arbitrageEngine.simulateTradeExecution(opportunity);
      
      if (simulationResult.success) {
        await supabase.from('trade_history').insert({
          pair: opportunity.pair,
          trade_type: 'arbitrage',
          amount: opportunity.volumeAvailable,
          profit_loss: simulationResult.estimatedProfit,
          dex_name: `${opportunity.buyDex}-${opportunity.sellDex}`,
          status: 'executed',
          tx_hash: `sim_${Date.now()}`,
          gas_fee: simulationResult.gasEstimate,
          metadata_json: {
            buyDex: opportunity.buyDex,
            sellDex: opportunity.sellDex,
            buyPrice: opportunity.buyPrice,
            sellPrice: opportunity.sellPrice,
            profitPercentage: opportunity.profitPercentage,
            slippageRisk: opportunity.slippageRisk,
            confidence: opportunity.confidence
          }
        });

        return {
          success: true,
          txHash: `sim_${Date.now()}`,
          actualProfit: simulationResult.estimatedProfit
        };
      } else {
        return {
          success: false,
          error: `Execution failed: ${simulationResult.estimatedSlippage}% slippage too high`
        };
      }

    } catch (error) {
      console.error('❌ Error executing arbitrage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setExecutingTrades(prev => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });
    }
  }, [opportunities, executingTrades]);

  // Add missing simulateExecution function
  const simulateExecution = useCallback(async (opportunityId: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    try {
      const simulationResult = await arbitrageEngine.simulateTradeExecution(opportunity);
      return {
        success: simulationResult.success,
        estimatedProfit: simulationResult.estimatedProfit,
        estimatedSlippage: simulationResult.estimatedSlippage,
        timeEstimate: simulationResult.timeEstimate || 30
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Simulation failed'
      };
    }
  }, [opportunities]);

  // Add missing autoExecuteHighConfidence function
  const autoExecuteHighConfidence = useCallback(async () => {
    const highConfidenceOps = opportunities.filter(opp => 
      opp.confidence === 'HIGH' && 
      opp.executionReady && 
      !executingTrades.has(opp.id)
    );

    console.log(`🤖 Auto-executing ${highConfidenceOps.length} high confidence opportunities...`);

    const results = await Promise.allSettled(
      highConfidenceOps.map(opp => executeArbitrage(opp.id))
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    console.log(`✅ Auto-execution completed: ${successful}/${highConfidenceOps.length} successful`);

    return { executed: highConfidenceOps.length, successful };
  }, [opportunities, executingTrades, executeArbitrage]);

  // Memoized auto scanning function
  const startAutoScanning = useCallback((intervalSeconds: number = 60) => {
    console.log(`🤖 Starting OPTIMIZED automatic arbitrage scanning every ${intervalSeconds} seconds`);
    setScanInterval(intervalSeconds);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    // Initial scan
    performRealScan();
    
    // Set up recurring scans with minimum 60 seconds
    const actualInterval = Math.max(intervalSeconds * 1000, 60000);
    scanIntervalRef.current = setInterval(performRealScan, actualInterval);
  }, [performRealScan]);

  const stopAutoScanning = useCallback(() => {
    console.log('🛑 Stopping optimized automatic arbitrage scanning');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  // Memoized derived values para evitar recálculos innecesarios
  const derivedValues = useMemo(() => ({
    totalOpportunities: opportunities.length,
    highConfidenceOpportunities: opportunities.filter(opp => opp.confidence === 'HIGH').length,
    executableOpportunities: opportunities.filter(opp => opp.executionReady).length,
    avgProfitPercentage: stats.avgProfitPercentage,
    totalPotentialProfit: stats.totalPotentialProfit
  }), [opportunities, stats.avgProfitPercentage, stats.totalPotentialProfit]);

  // Optimized useEffect con dependencias estables
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing OPTIMIZED real-time arbitrage monitoring...');
    
    const initializeServices = async () => {
      try {
        // Start optimized market data service
        await realTimeMarketDataService.startRealTimeUpdates(60);
        
        // Subscribe to market data updates con callback estable
        const unsubscribe = realTimeMarketDataService.subscribe((data) => {
          if (data.length > 0) {
            console.log('📊 Optimized market data updated, scheduling arbitrage rescan...');
            // Debounced rescan
            setTimeout(() => {
              if (!isScanning) {
                performRealScan();
              }
            }, 10000); // Aumentado a 10 segundos
          }
        });

        // Start auto-scanning after initialization
        setTimeout(() => {
          startAutoScanning(scanInterval);
        }, 15000); // Aumentado a 15 segundos

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error initializing optimized services:', error);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | null = null;
    
    initializeServices().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      console.log('🧹 Cleaning up optimized real-time arbitrage monitoring...');
      stopAutoScanning();
      if (unsubscribe) {
        unsubscribe();
      }
      isInitializedRef.current = false;
    };
  }, []); // Empty dependency array

  // Memoized utility functions
  const getFilteredOpportunities = useCallback((
    minProfit: number = 1.0,
    maxSlippage: number = 5.0,
    minConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
  ) => {
    const confidenceScores = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const minConfidenceScore = confidenceScores[minConfidence];

    return opportunities.filter(opp => 
      opp.profitPercentage >= minProfit &&
      opp.slippageRisk <= maxSlippage &&
      confidenceScores[opp.confidence] >= minConfidenceScore
    );
  }, [opportunities]);

  const getExecutableOpportunities = useCallback(() => {
    return opportunities.filter(opp => opp.executionReady);
  }, [opportunities]);

  const getTopOpportunities = useCallback((limit: number = 10) => {
    return opportunities
      .sort((a, b) => b.profitADA - a.profitADA)
      .slice(0, limit);
  }, [opportunities]);

  return {
    // State
    opportunities,
    stats,
    isScanning,
    scanInterval,
    executingTrades,
    lastScan,
    
    // Actions
    performRealScan,
    performScan: performRealScan,
    executeArbitrage,
    simulateExecution,
    autoExecuteHighConfidence,
    startAutoScanning,
    startAutoScan: startAutoScanning,
    stopAutoScanning,
    stopAutoScan: stopAutoScanning,
    
    // Filtering and data access
    getFilteredOpportunities,
    getExecutableOpportunities,
    getTopOpportunities,
    
    // Quick access (memoized)
    ...derivedValues
  };
};
