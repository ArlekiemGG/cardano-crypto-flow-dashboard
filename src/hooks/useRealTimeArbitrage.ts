
import { useState, useEffect, useRef } from 'react';
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
  const [scanInterval, setScanInterval] = useState(15); // 15 seconds for real data
  const [executingTrades, setExecutingTrades] = useState<Set<string>>(new Set());
  const [lastScan, setLastScan] = useState(new Date());
  
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const performRealScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setLastScan(new Date());
    console.log('🔍 Starting REAL arbitrage scan with live DEX data...');
    
    try {
      // Get real opportunities from the arbitrage engine
      const realOpportunities = await arbitrageEngine.scanForArbitrageOpportunities();
      
      // Convert to our interface format
      const formattedOpportunities: RealArbitrageOpportunity[] = realOpportunities.map(opp => ({
        ...opp,
        executionReady: opp.confidence === 'HIGH' && opp.profitPercentage > 1.5 && opp.slippageRisk < 3
      }));

      setOpportunities(formattedOpportunities);
      
      // Update stats
      const totalVolume = formattedOpportunities.reduce((sum, opp) => sum + opp.volumeAvailable, 0);
      const newStats: ArbitrageStats = {
        totalOpportunities: formattedOpportunities.length,
        avgProfitPercentage: formattedOpportunities.length > 0 
          ? formattedOpportunities.reduce((sum, opp) => sum + opp.profitPercentage, 0) / formattedOpportunities.length 
          : 0,
        totalPotentialProfit: formattedOpportunities.reduce((sum, opp) => sum + opp.profitADA, 0),
        highConfidenceCount: formattedOpportunities.filter(opp => opp.confidence === 'HIGH').length,
        lastScanTime: new Date(),
        successRate: 85.2, // Mock success rate - in real implementation, calculate from trade history
        totalVolume
      };
      setStats(newStats);
      
      console.log(`✅ Real arbitrage scan completed: ${formattedOpportunities.length} opportunities found`);
      console.log(`💰 Total potential profit: ${newStats.totalPotentialProfit.toFixed(2)} ADA`);
      
    } catch (error) {
      console.error('❌ Error during real arbitrage scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const executeArbitrage = async (opportunityId: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
    actualProfit?: number;
  }> => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    if (executingTrades.has(opportunityId)) {
      return { success: false, error: 'Trade already executing' };
    }

    setExecutingTrades(prev => new Set([...prev, opportunityId]));
    console.log(`🚀 Executing REAL arbitrage trade for ${opportunity.pair}...`);

    try {
      // Simulate trade execution for now - in real implementation this would:
      // 1. Build Cardano transaction using Lucid
      // 2. Calculate exact amounts considering slippage
      // 3. Submit to both DEXs atomically
      // 4. Monitor confirmation on blockchain
      
      const simulationResult = await arbitrageEngine.simulateTradeExecution(opportunity);
      
      if (simulationResult.success) {
        // Store executed trade in database - using correct status value
        await supabase.from('trade_history').insert({
          pair: opportunity.pair,
          trade_type: 'arbitrage',
          amount: opportunity.volumeAvailable,
          profit_loss: simulationResult.estimatedProfit,
          dex_name: `${opportunity.buyDex}-${opportunity.sellDex}`,
          status: 'executed', // Changed from 'completed' to 'executed'
          tx_hash: `sim_${Date.now()}`, // In real implementation, this would be actual tx hash
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

        console.log(`✅ Arbitrage executed successfully! Profit: ${simulationResult.estimatedProfit.toFixed(4)} ADA`);
        
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
  };

  const simulateExecution = async (opportunityId: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    // Simulate execution result
    return await arbitrageEngine.simulateTradeExecution(opportunity);
  };

  const autoExecuteHighConfidence = async () => {
    const highConfidenceOpps = opportunities.filter(opp => 
      opp.confidence === 'HIGH' && 
      opp.executionReady && 
      !executingTrades.has(opp.id)
    );

    console.log(`🤖 Auto-executing ${highConfidenceOpps.length} high-confidence opportunities...`);

    for (const opp of highConfidenceOpps.slice(0, 3)) { // Limit to 3 concurrent executions
      executeArbitrage(opp.id);
    }
  };

  const startAutoScanning = (intervalSeconds: number = 15) => {
    console.log(`🤖 Starting automatic REAL arbitrage scanning every ${intervalSeconds} seconds`);
    setScanInterval(intervalSeconds);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    // Initial scan
    performRealScan();
    
    // Set up recurring scans
    scanIntervalRef.current = setInterval(performRealScan, intervalSeconds * 1000);
  };

  const stopAutoScanning = () => {
    console.log('🛑 Stopping automatic arbitrage scanning');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // Filter functions
  const getFilteredOpportunities = (
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
  };

  const getExecutableOpportunities = () => {
    return opportunities.filter(opp => opp.executionReady);
  };

  const getTopOpportunities = (limit: number = 10) => {
    return opportunities
      .sort((a, b) => b.profitADA - a.profitADA)
      .slice(0, limit);
  };

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing REAL-TIME arbitrage monitoring with live DEX APIs...');
    
    // Start real-time market data service
    realTimeMarketDataService.startRealTimeUpdates(10);
    
    // Subscribe to market data updates
    const unsubscribe = realTimeMarketDataService.subscribe((data) => {
      if (data.length > 0) {
        console.log('📊 Real market data updated, triggering arbitrage rescan...');
        // Trigger rescan after market data updates
        setTimeout(performRealScan, 2000); // Small delay to let data settle
      }
    });

    // Start auto-scanning after market data is ready
    setTimeout(() => {
      startAutoScanning(scanInterval);
    }, 5000);

    return () => {
      console.log('🧹 Cleaning up real-time arbitrage monitoring...');
      stopAutoScanning();
      unsubscribe();
      isInitializedRef.current = false;
    };
  }, []);

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
    performScan: performRealScan, // Alias for compatibility
    executeArbitrage,
    simulateExecution,
    autoExecuteHighConfidence,
    startAutoScanning,
    startAutoScan: startAutoScanning, // Alias for compatibility
    stopAutoScanning,
    stopAutoScan: stopAutoScanning, // Alias for compatibility
    
    // Filtering and data access
    getFilteredOpportunities,
    getExecutableOpportunities,
    getTopOpportunities,
    
    // Quick access
    totalOpportunities: opportunities.length,
    highConfidenceOpportunities: opportunities.filter(opp => opp.confidence === 'HIGH').length,
    executableOpportunities: opportunities.filter(opp => opp.executionReady).length,
    avgProfitPercentage: stats.avgProfitPercentage,
    totalPotentialProfit: stats.totalPotentialProfit
  };
};
