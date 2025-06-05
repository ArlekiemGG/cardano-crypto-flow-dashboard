
import { MetricCard } from "@/components/MetricCard"
import { Bot, Play, Pause, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TradingStrategies() {
  const strategies = [
    { 
      name: "DCA Bot", 
      status: "active", 
      profit: "+₳ 234.56", 
      trades: 45, 
      pair: "ADA/USDC",
      created: "2024-01-15"
    },
    { 
      name: "Grid Trading", 
      status: "active", 
      profit: "+₳ 189.23", 
      trades: 67, 
      pair: "ADA/BTC",
      created: "2024-01-10"
    },
    { 
      name: "Mean Reversion", 
      status: "paused", 
      profit: "-₳ 12.45", 
      trades: 23, 
      pair: "ADA/ETH",
      created: "2024-01-20"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Strategies</h1>
          <p className="text-gray-400 mt-2">Manage and configure your automated trading bots</p>
        </div>
        <Button className="mt-4 lg:mt-0 bg-gradient-to-r from-crypto-primary to-crypto-secondary hover:from-crypto-secondary hover:to-crypto-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Strategy
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Strategies"
          value="7"
          change="+2 today"
          changeType="positive"
          icon={Bot}
          gradient="gradient-primary"
        />
        
        <MetricCard
          title="Total Profit"
          value="₳ 1,847.32"
          change="+₳ 234.56"
          changeType="positive"
          icon={Play}
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Success Rate"
          value="87.4%"
          change="+2.1%"
          changeType="positive"
          icon={Settings}
          gradient="gradient-success"
        />
        
        <MetricCard
          title="Total Trades"
          value="2,847"
          change="+156 today"
          changeType="positive"
          icon={Plus}
          gradient="gradient-secondary"
        />
      </div>

      {/* Strategy List */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Your Strategies</h2>
        
        <div className="space-y-4">
          {strategies.map((strategy, index) => (
            <div key={index} className="glass rounded-lg p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    strategy.status === 'active' 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-gray-500/20 border border-gray-500/30'
                  }`}>
                    <Bot className={`h-6 w-6 ${
                      strategy.status === 'active' ? 'text-green-400' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold text-lg">{strategy.name}</h3>
                    <p className="text-gray-400">{strategy.pair} • {strategy.trades} trades</p>
                    <p className="text-gray-500 text-sm">Created: {strategy.created}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-bold font-mono ${
                      strategy.profit.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {strategy.profit}
                    </p>
                    <p className={`text-sm ${
                      strategy.status === 'active' ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm"
                      className={strategy.status === 'active' 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }
                    >
                      {strategy.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Templates */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Strategy Templates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "DCA Strategy", description: "Dollar Cost Averaging", difficulty: "Beginner" },
            { name: "Grid Trading", description: "Buy low, sell high in grids", difficulty: "Intermediate" },
            { name: "Mean Reversion", description: "Statistical arbitrage", difficulty: "Advanced" },
          ].map((template, index) => (
            <div key={index} className="glass rounded-lg p-6 hover:bg-white/5 transition-colors cursor-pointer">
              <h3 className="text-white font-semibold mb-2">{template.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  template.difficulty === 'Beginner' 
                    ? 'bg-green-500/20 text-green-400' 
                    : template.difficulty === 'Intermediate'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {template.difficulty}
                </span>
                <Button size="sm" className="bg-crypto-primary hover:bg-crypto-secondary">
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
