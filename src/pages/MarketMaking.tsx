
import { MetricCard } from "@/components/MetricCard"
import { Layers, TrendingUp, BarChart3, DollarSign } from "lucide-react"
import { useMarketMaking } from "@/hooks/useMarketMaking"
import { ActivePositionsTable } from "@/components/market-making/ActivePositionsTable"
import { SpreadCalculator } from "@/components/market-making/SpreadCalculator"
import { RiskManagementTools } from "@/components/market-making/RiskManagementTools"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function MarketMaking() {
  const {
    positions,
    isLoading,
    togglePosition,
    removeLiquidity,
    getTotalStats,
    isConnected
  } = useMarketMaking();

  const stats = getTotalStats();

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Market Making</h1>
          <p className="text-gray-400 mt-2">Provide liquidity and earn fees from trading spreads</p>
          {!isConnected && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-yellow-400 text-sm">
                Connect your wallet to start providing liquidity and earning fees
              </p>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Active Pairs"
            value={stats.activePairs.toString()}
            change={`+${Math.floor(Math.random() * 3 + 1)} today`}
            changeType="positive"
            icon={Layers}
            gradient="gradient-primary"
          />
          
          <MetricCard
            title="Liquidity Provided"
            value={`₳ ${stats.totalLiquidity.toLocaleString()}`}
            change={`+₳ ${(stats.totalLiquidity * 0.1).toLocaleString()}`}
            changeType="positive"
            icon={DollarSign}
            gradient="gradient-success"
          />
          
          <MetricCard
            title="Fees Earned"
            value={`₳ ${stats.totalFeesEarned.toFixed(2)}`}
            change={`+₳ ${(stats.totalFeesEarned * 0.15).toFixed(2)}`}
            changeType="positive"
            icon={TrendingUp}
            gradient="gradient-profit"
          />
          
          <MetricCard
            title="Avg APY"
            value={`${stats.avgAPY.toFixed(1)}%`}
            change={`+${(Math.random() * 2).toFixed(1)}%`}
            changeType="positive"
            icon={BarChart3}
            gradient="gradient-secondary"
          />
        </div>

        {/* Active Positions */}
        <ActivePositionsTable
          positions={positions}
          onTogglePosition={togglePosition}
          onRemoveLiquidity={removeLiquidity}
          isLoading={isLoading}
        />

        {/* Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpreadCalculator />
          <RiskManagementTools />
        </div>
      </div>
    </ProtectedRoute>
  );
}
