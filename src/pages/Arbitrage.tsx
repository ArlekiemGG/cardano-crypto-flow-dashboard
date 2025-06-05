
import { MetricCard } from "@/components/MetricCard"
import { TrendingUp, Clock, Zap, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Arbitrage() {
  const opportunities = [
    { 
      pair: "ADA/USDC", 
      exchange1: "DEX A", 
      exchange2: "DEX B", 
      price1: "0.4523", 
      price2: "0.4578", 
      profit: "1.22%", 
      volume: "₳ 15,230",
      confidence: "High"
    },
    { 
      pair: "ADA/BTC", 
      exchange1: "DEX C", 
      exchange2: "DEX D", 
      price1: "0.0000189", 
      price2: "0.0000192", 
      profit: "1.59%", 
      volume: "₳ 8,450",
      confidence: "Medium"
    },
    { 
      pair: "ADA/ETH", 
      exchange1: "DEX B", 
      exchange2: "DEX E", 
      price1: "0.000274", 
      price2: "0.000279", 
      profit: "1.82%", 
      volume: "₳ 23,100",
      confidence: "High"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Arbitrage Opportunities</h1>
          <p className="text-gray-400 mt-2">Discover and execute profitable price differences across DEXs</p>
        </div>
        <Button className="mt-4 lg:mt-0 bg-gradient-to-r from-crypto-profit to-crypto-success hover:from-crypto-success hover:to-crypto-profit">
          <Zap className="h-4 w-4 mr-2" />
          Auto Execute All
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Available Opportunities"
          value="23"
          change="+5 new"
          changeType="positive"
          icon={TrendingUp}
          gradient="gradient-success"
        />
        
        <MetricCard
          title="Average Profit"
          value="1.47%"
          change="+0.12%"
          changeType="positive"
          icon={Target}
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Executed Today"
          value="15"
          change="12 profitable"
          changeType="positive"
          icon={Zap}
          gradient="gradient-primary"
        />
        
        <MetricCard
          title="Response Time"
          value="0.8s"
          change="-0.2s"
          changeType="positive"
          icon={Clock}
          gradient="gradient-secondary"
        />
      </div>

      {/* Opportunities Table */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Live Opportunities</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">Live Data</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Pair</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Exchange A</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Exchange B</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Profit</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Volume</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Confidence</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-white font-medium">{opp.pair}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white">{opp.exchange1}</div>
                      <div className="text-gray-400 text-sm font-mono">{opp.price1}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white">{opp.exchange2}</div>
                      <div className="text-gray-400 text-sm font-mono">{opp.price2}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-green-400 font-bold">{opp.profit}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white font-mono">{opp.volume}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      opp.confidence === 'High' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {opp.confidence}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Button size="sm" className="bg-crypto-primary hover:bg-crypto-secondary">
                      Execute
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Arbitrage Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Minimum Profit %</label>
            <input 
              type="number" 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" 
              placeholder="1.0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Max Investment</label>
            <input 
              type="number" 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" 
              placeholder="1000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Auto Execute</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
              <option value="off">Off</option>
              <option value="high">High Confidence Only</option>
              <option value="all">All Opportunities</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
