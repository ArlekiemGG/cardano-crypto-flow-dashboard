
import { useMemo, useCallback } from 'react';

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

export const useArbitrageOpportunityUtils = (
  opportunities: RealArbitrageOpportunity[],
  stats: ArbitrageStats
) => {
  const derivedValues = useMemo(() => ({
    totalOpportunities: opportunities.length,
    highConfidenceOpportunities: opportunities.filter(opp => opp.confidence === 'HIGH').length,
    executableOpportunities: opportunities.filter(opp => opp.executionReady).length,
    avgProfitPercentage: stats.avgProfitPercentage,
    totalPotentialProfit: stats.totalPotentialProfit
  }), [opportunities, stats.avgProfitPercentage, stats.totalPotentialProfit]);

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
    ...derivedValues,
    getFilteredOpportunities,
    getExecutableOpportunities,
    getTopOpportunities
  };
};
