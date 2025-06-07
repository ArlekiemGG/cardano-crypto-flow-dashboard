
interface ArbitrageOpportunity {
  id: string;
  profitPercentage: number;
  profitADA: number;
  confidence: string;
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

  const totalOpportunities = opportunities.length;
  const highConfidenceOpportunities = opportunities.filter(opp => opp.confidence === 'HIGH').length;
  const avgProfitPercentage = stats.avgProfitPercentage;
  const totalPotentialProfit = opportunities.reduce((sum, opp) => sum + opp.profitADA, 0);

  return {
    getTopOpportunities,
    totalOpportunities,
    highConfidenceOpportunities,
    avgProfitPercentage,
    totalPotentialProfit
  };
};
