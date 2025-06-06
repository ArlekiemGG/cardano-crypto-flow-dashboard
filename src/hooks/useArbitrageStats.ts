
import { useMemo } from 'react';

interface ArbitrageOpportunity {
  id: string;
  profitPercentage: number;
  profitADA: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  volumeAvailable: number;
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

export const useArbitrageStats = (
  opportunities: ArbitrageOpportunity[],
  stats: ArbitrageStats
) => {
  return useMemo(() => ({
    totalOpportunities: opportunities.length,
    highConfidenceOpportunities: opportunities.filter(opp => opp.confidence === 'HIGH').length,
    executableOpportunities: opportunities.filter(opp => opp.executionReady).length,
    avgProfitPercentage: stats.avgProfitPercentage,
    totalPotentialProfit: stats.totalPotentialProfit
  }), [opportunities, stats.avgProfitPercentage, stats.totalPotentialProfit]);
};
