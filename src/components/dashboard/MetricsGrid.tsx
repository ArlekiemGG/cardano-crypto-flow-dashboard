
import { MetricCard } from "@/components/MetricCard";
import { TrendingUp, DollarSign, Activity, Database } from "lucide-react";

interface MetricsGridProps {
  portfolioValue: number;
  dailyPnL: number;
  totalOpportunities: number;
  highConfidenceOpportunities: number;
  totalPotentialProfit: number;
  avgProfitPercentage: number;
  totalVolume24h: number;
}

export const MetricsGrid = ({
  portfolioValue,
  dailyPnL,
  totalOpportunities,
  highConfidenceOpportunities,
  totalPotentialProfit,
  avgProfitPercentage,
  totalVolume24h
}: MetricsGridProps) => {
  // Format volume to show in readable format
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    } else {
      return `$${volume.toFixed(0)}`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Portfolio Value"
        value={`$${portfolioValue.toFixed(2)}`}
        change={dailyPnL >= 0 ? `+$${dailyPnL.toFixed(2)}` : `-$${Math.abs(dailyPnL).toFixed(2)}`}
        changeType={dailyPnL >= 0 ? 'positive' : 'negative'}
        icon={DollarSign}
      />
      
      <MetricCard
        title="Arbitrage Opportunities"
        value={totalOpportunities.toString()}
        description={`${highConfidenceOpportunities} high confidence`}
        icon={TrendingUp}
      />
      
      <MetricCard
        title="Potential Profit"
        value={`₳${totalPotentialProfit.toFixed(1)}`}
        description={`${avgProfitPercentage.toFixed(1)}% avg`}
        icon={Activity}
      />
      
      <MetricCard
        title="DEX Volume 24h"
        value={formatVolume(totalVolume24h)}
        description="DeFiLlama data"
        icon={Database}
      />
    </div>
  );
};
