
import { MetricCard } from "@/components/MetricCard"
import { BarChart3, TrendingUp, Bot, DollarSign, Activity, Zap } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="glass rounded-2xl p-8 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-crypto-primary to-crypto-secondary bg-clip-text text-transparent">
              Welcome to Cardano Pro
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Professional trading suite for automated strategies, arbitrage opportunities, and portfolio management on Cardano.
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <div className="p-6 rounded-xl bg-gradient-to-br from-crypto-primary/20 to-crypto-secondary/20 border border-crypto-primary/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">₳ 12,450.67</div>
                <div className="text-crypto-primary text-sm">Total Portfolio Value</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="24h Profit/Loss"
          value="₳ 234.56"
          change="+12.4%"
          changeType="positive"
          icon={TrendingUp}
          description="Last 24 hours performance"
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Active Strategies"
          value="7"
          change="2 new"
          changeType="positive"
          icon={Bot}
          description="Running trading bots"
          gradient="gradient-primary"
        />
        
        <MetricCard
          title="Arbitrage Opportunities"
          value="23"
          change="+5 today"
          changeType="positive"
          icon={Activity}
          description="Available profit opportunities"
          gradient="gradient-secondary"
        />
        
        <MetricCard
          title="Total Trades"
          value="1,247"
          change="+23 today"
          changeType="positive"
          icon={BarChart3}
          description="All time executed trades"
          gradient="gradient-success"
        />
        
        <MetricCard
          title="Success Rate"
          value="89.2%"
          change="+2.1%"
          changeType="positive"
          icon={Zap}
          description="Profitable trades ratio"
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Portfolio Value"
          value="₳ 12,450"
          change="+₳ 1,203"
          changeType="positive"
          icon={DollarSign}
          description="Current total value"
          gradient="gradient-primary"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Portfolio Performance</h2>
          <div className="h-64 bg-gradient-to-br from-crypto-primary/10 to-crypto-secondary/10 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Chart Placeholder - Portfolio Growth</p>
          </div>
        </div>
        
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Trading Activity</h2>
          <div className="h-64 bg-gradient-to-br from-crypto-success/10 to-crypto-profit/10 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Chart Placeholder - Trading Volume</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: "Arbitrage executed", pair: "ADA/USDC", profit: "+₳ 45.67", time: "2 minutes ago", type: "profit" },
            { action: "Strategy activated", pair: "ADA/BTC", status: "Running", time: "5 minutes ago", type: "info" },
            { action: "Market making order", pair: "ADA/ETH", profit: "+₳ 12.34", time: "12 minutes ago", type: "profit" },
            { action: "Stop loss triggered", pair: "ADA/USDT", loss: "-₹ 8.90", time: "25 minutes ago", type: "loss" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'profit' ? 'bg-green-400' : 
                  activity.type === 'loss' ? 'bg-red-400' : 'bg-blue-400'
                }`}></div>
                <div>
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-gray-400 text-sm">{activity.pair}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono ${
                  activity.type === 'profit' ? 'text-green-400' : 
                  activity.type === 'loss' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {activity.profit || activity.status || activity.loss}
                </p>
                <p className="text-gray-500 text-sm">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
