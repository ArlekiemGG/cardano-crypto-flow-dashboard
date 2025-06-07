
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
  timeToExpiry?: number;
  slippageRisk?: number;
  executionReady?: boolean;
}

interface ArbitrageStats {
  totalOpportunities: number;
  avgProfitPercentage: number;
  totalPotentialProfit: number;
  highConfidenceCount: number;
}

export const useArbitrageOpportunityUtils = (
  opportunities: ArbitrageOpportunity[], 
  stats: ArbitrageStats
) => {
  const getTopOpportunities = (limit: number = 10) => {
    return opportunities
      .sort((a, b) => b.profitPercentage - a.profitPercentage)
      .slice(0, limit);
  };

  const getExecutableOpportunities = () => {
    return opportunities.filter(opp => 
      opp.confidence === 'HIGH' && 
      opp.profitPercentage > 5.0 && 
      (opp.executionReady ?? true)
    );
  };

  const totalOpportunities = opportunities.length;
  const highConfidenceOpportunities = opportunities.filter(opp => opp.confidence === 'HIGH').length;
  const avgProfitPercentage = stats.avgProfitPercentage;
  const totalPotentialProfit = opportunities.reduce((sum, opp) => sum + opp.profitADA, 0);

  return {
    getTopOpportunities,
    getExecutableOpportunities,
    totalOpportunities,
    highConfidenceOpportunities,
    avgProfitPercentage,
    totalPotentialProfit
  };
};
