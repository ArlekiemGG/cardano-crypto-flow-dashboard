
import { MetricCard } from "@/components/MetricCard";
import { BarChart3, TrendingUp, Bot, DollarSign, Activity, Zap } from "lucide-react";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        title="Portfolio Value"
        value={`$${portfolioValue.toFixed(2)}`}
        change={`${dailyPnL >= 0 ? '+' : ''}$${Math.abs(dailyPnL).toFixed(2)}`}
        changeType={dailyPnL >= 0 ? "positive" : "negative"}
        icon={DollarSign}
        description="Live USD value of your ADA"
        gradient="gradient-primary"
      />
      
      <MetricCard
        title="Live Arbitrage Ops"
        value={totalOpportunities.toString()}
        change={`${highConfidenceOpportunities} high confidence`}
        changeType="positive"
        icon={Zap}
        description="Real-time arbitrage detection"
        gradient="gradient-success"
      />
      
      <MetricCard
        title="Potential Profit"
        value={`₳ ${totalPotentialProfit.toFixed(1)}`}
        change={`${avgProfitPercentage.toFixed(1)}% avg profit`}
        changeType="positive"
        icon={TrendingUp}
        description="Total available profit"
        gradient="gradient-profit"
      />
      
      <MetricCard
        title="Active Data Pairs"
        value={activePairs.toString()}
        change="Live DeFi data"
        changeType="positive"
        icon={Activity}
        description="Live pairs from Blockfrost + DeFiLlama"
        gradient="gradient-secondary"
      />
      
      <MetricCard
        title="24h DeFi Volume"
        value={`$${(totalVolume24h / 1000000).toFixed(1)}M`}
        change="All Cardano DeFi"
        changeType="positive"
        icon={BarChart3}
        description="Total volume across Cardano protocols"
        gradient="gradient-profit"
      />
      
      <MetricCard
        title="Data Sources"
        value={`${connectedSources}/2`}
        change="Blockfrost + DeFiLlama"
        changeType={connectedSources > 1 ? "positive" : "negative"}
        icon={Bot}
        description="Simplified, reliable data architecture"
        gradient="gradient-primary"
      />
    </div>
  );
};
