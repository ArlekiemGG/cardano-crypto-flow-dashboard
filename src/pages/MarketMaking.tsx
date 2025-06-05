
import { MetricCard } from "@/components/MetricCard"
import { Layers, TrendingUp, BarChart3, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MarketMaking() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Market Making</h1>
        <p className="text-gray-400 mt-2">Provide liquidity and earn fees from trading spreads</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Pairs"
          value="12"
          change="+3 today"
          changeType="positive"
          icon={Layers}
          gradient="gradient-primary"
        />
        
        <MetricCard
          title="Liquidity Provided"
          value="₳ 25,430"
          change="+₳ 2,340"
          changeType="positive"
          icon={DollarSign}
          gradient="gradient-success"
        />
        
        <MetricCard
          title="Fees Earned"
          value="₳ 156.78"
          change="+₳ 23.45"
          changeType="positive"
          icon={TrendingUp}
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Volume 24h"
          value="₳ 89,234"
          change="+12.4%"
          changeType="positive"
          icon={BarChart3}
          gradient="gradient-secondary"
        />
      </div>

      {/* Active Positions */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Active Positions</h2>
        <div className="h-64 bg-gradient-to-br from-crypto-primary/10 to-crypto-secondary/10 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Market Making Interface - Coming Soon</p>
        </div>
      </div>

      {/* Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Spread Calculator</h2>
          <div className="h-48 bg-gradient-to-br from-crypto-success/10 to-crypto-profit/10 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Spread Calculator Tool</p>
          </div>
        </div>
        
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Risk Management</h2>
          <div className="h-48 bg-gradient-to-br from-crypto-accent/10 to-crypto-loss/10 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Risk Management Tools</p>
          </div>
        </div>
      </div>
    </div>
  )
}
