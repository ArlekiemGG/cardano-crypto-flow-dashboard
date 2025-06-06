
import { MetricCard } from "@/components/MetricCard"
import { Layers, TrendingUp, BarChart3, DollarSign, Plus } from "lucide-react"
import { useMarketMaking } from "@/hooks/useMarketMaking"
import { useRealMarketMakingStats } from "@/hooks/useRealMarketMakingStats"
import { ActivePositionsTable } from "@/components/market-making/ActivePositionsTable"
import { SpreadCalculator } from "@/components/market-making/SpreadCalculator"
import { RiskManagementTools } from "@/components/market-making/RiskManagementTools"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { AddLiquidityModal } from "@/components/market-making/AddLiquidityModal"
import { useState } from "react"

export default function MarketMaking() {
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const {
    positions,
    isLoading,
    togglePosition,
    removeLiquidity,
    isConnected,
    refetchPositions
  } = useMarketMaking();

  const { stats } = useRealMarketMakingStats();

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
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
          
          {isConnected && (
            <Button 
              onClick={() => setShowAddLiquidity(true)}
              className="bg-crypto-primary hover:bg-crypto-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Liquidity
            </Button>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Active Pairs"
            value={stats.activePairs.toString()}
            change={`${stats.totalPositions} total positions`}
            changeType="neutral"
            icon={Layers}
            gradient="gradient-primary"
          />
          
          <MetricCard
            title="Liquidity Provided"
            value={`₳ ${stats.totalLiquidity.toLocaleString()}`}
            change={`${positions.length} active positions`}
            changeType="positive"
            icon={DollarSign}
            gradient="gradient-success"
          />
          
          <MetricCard
            title="Fees Earned"
            value={`₳ ${stats.totalFeesEarned.toFixed(2)}`}
            change={`₳ ${stats.profitLoss.toFixed(2)} P&L`}
            changeType={stats.profitLoss >= 0 ? "positive" : "negative"}
            icon={TrendingUp}
            gradient="gradient-profit"
          />
          
          <MetricCard
            title="Avg APY"
            value={`${stats.avgAPY.toFixed(1)}%`}
            change={`${stats.totalVolume.toLocaleString()} volume`}
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

        {/* Add Liquidity Modal */}
        <AddLiquidityModal 
          open={showAddLiquidity}
          onOpenChange={setShowAddLiquidity}
          onSuccess={refetchPositions}
        />
      </div>
    </ProtectedRoute>
  );
}
