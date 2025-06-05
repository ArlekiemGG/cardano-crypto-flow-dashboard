
import { MetricCard } from "@/components/MetricCard"
import { PieChart, TrendingUp, BarChart3, DollarSign } from "lucide-react"

export default function Portfolio() {
  const holdings = [
    { asset: "ADA", amount: "12,450.67", value: "₳ 12,450.67", allocation: "85%", change: "+2.4%" },
    { asset: "USDC", amount: "2,340.12", value: "₳ 2,340.12", allocation: "10%", change: "+0.1%" },
    { asset: "BTC", amount: "0.05432", value: "₳ 2,180.45", allocation: "5%", change: "+1.8%" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Portfolio Analysis</h1>
        <p className="text-gray-400 mt-2">Track your performance and asset allocation</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Value"
          value="₳ 16,971.24"
          change="+₳ 1,234.56"
          changeType="positive"
          icon={DollarSign}
          gradient="gradient-primary"
        />
        
        <MetricCard
          title="24h Change"
          value="+7.85%"
          change="₳ +1,235"
          changeType="positive"
          icon={TrendingUp}
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Total Return"
          value="+24.7%"
          change="All time"
          changeType="positive"
          icon={BarChart3}
          gradient="gradient-success"
        />
        
        <MetricCard
          title="Assets"
          value="3"
          change="Diversified"
          changeType="neutral"
          icon={PieChart}
          gradient="gradient-secondary"
        />
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Asset Allocation</h2>
          <div className="h-64 bg-gradient-to-br from-crypto-primary/10 to-crypto-secondary/10 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Pie Chart - Asset Allocation</p>
          </div>
        </div>
        
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Performance History</h2>
          <div className="h-64 bg-gradient-to-br from-crypto-success/10 to-crypto-profit/10 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Line Chart - Portfolio Performance</p>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Holdings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Value</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Allocation</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">24h Change</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-white font-medium">{holding.asset}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white font-mono">{holding.amount}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white font-mono">{holding.value}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-400">{holding.allocation}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-green-400 font-medium">{holding.change}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
