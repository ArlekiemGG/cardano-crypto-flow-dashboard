
import { MetricCard } from "@/components/MetricCard";
import { TrendingUp, DollarSign, Activity, Database, Zap, Globe } from "lucide-react";

interface MetricsGridProps {
  portfolioValue: number;
  dailyPnL: number;
  totalOpportunities: number;
  highConfidenceOpportunities: number;
  totalPotentialProfit: number;
  avgProfitPercentage: number;
  activePairs: number;
  totalVolume24h: number;
  connectedSources: number;
}

export const MetricsGrid = ({
  portfolioValue,
  dailyPnL,
  totalOpportunities,
  highConfidenceOpportunities,
  totalPotentialProfit,
  avgProfitPercentage,
  activePairs,
  totalVolume24h,
  connectedSources
}: MetricsGridProps) => {
  // Formatear volumen para mostrar en formato legible
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
        change={dailyPnL}
        icon={<DollarSign className="h-5 w-5" />}
      />
      
      <MetricCard
        title="Arbitrage Opportunities"
        value={totalOpportunities.toString()}
        subValue={`${highConfidenceOpportunities} high confidence`}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      
      <MetricCard
        title="Potential Profit"
        value={`₳${totalPotentialProfit.toFixed(1)}`}
        subValue={`${avgProfitPercentage.toFixed(1)}% avg`}
        icon={<Activity className="h-5 w-5" />}
      />
      
      <MetricCard
        title="DEX Volume 24h"
        value={formatVolume(totalVolume24h)}
        subValue="DeFiLlama data"
        icon={<Database className="h-5 w-5" />}
      />
      
      <MetricCard
        title="Active Pairs"
        value={activePairs.toString()}
        subValue="Trading pairs"
        icon={<Zap className="h-5 w-5" />}
      />
      
      <MetricCard
        title="Data Sources"
        value={`${connectedSources}/2`}
        subValue="Connected"
        icon={<Globe className="h-5 w-5" />}
      />
    </div>
  );
};
