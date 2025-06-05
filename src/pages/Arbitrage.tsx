
import { MetricCard } from "@/components/MetricCard"
import { TrendingUp, Clock, Zap, Target, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRealTimeData } from "@/hooks/useRealTimeData"

export default function Arbitrage() {
  const { arbitrageOpportunities, isConnected } = useRealTimeData()

  const handleExecuteArbitrage = (opportunityId: string) => {
    console.log(`Executing arbitrage for opportunity: ${opportunityId}`)
    // TODO: Implement real arbitrage execution via DEX APIs
  }

  const handleAutoExecuteAll = () => {
    console.log('Auto-executing all high-confidence opportunities')
    // TODO: Implement batch arbitrage execution
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Arbitrage Detection</h1>
          <p className="text-gray-400 mt-2">Real-time price differences across Cardano DEXs with instant execution</p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <Button 
            variant="outline" 
            className="border-crypto-primary/30 text-crypto-primary hover:bg-crypto-primary/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh DEXs
          </Button>
          <Button 
            className="bg-gradient-to-r from-crypto-profit to-crypto-success hover:from-crypto-success hover:to-crypto-profit"
            onClick={handleAutoExecuteAll}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto Execute All
          </Button>
        </div>
      </div>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Live Opportunities"
          value={arbitrageOpportunities.length.toString()}
          change={`${isConnected ? 'Live feed active' : 'Connecting...'}`}
          changeType="positive"
          icon={TrendingUp}
          gradient="gradient-success"
        />
        
        <MetricCard
          title="Average Profit"
          value={`${arbitrageOpportunities.length > 0 ? 
            (arbitrageOpportunities.reduce((acc, opp) => acc + opp.profitPercentage, 0) / arbitrageOpportunities.length).toFixed(2) 
            : '0.00'}%`}
          change="Real-time calculation"
          changeType="positive"
          icon={Target}
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="DEX Connections"
          value="5"
          change="SundaeSwap, Minswap, WingRiders..."
          changeType="positive"
          icon={Zap}
          gradient="gradient-primary"
        />
        
        <MetricCard
          title="Execution Speed"
          value="<2s"
          change="Average execution time"
          changeType="positive"
          icon={Clock}
          gradient="gradient-secondary"
        />
      </div>

      {/* Live Opportunities Table */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Live Arbitrage Opportunities</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Live DEX Data' : 'Connecting...'}
            </span>
          </div>
        </div>

        {arbitrageOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">No arbitrage opportunities detected</div>
            <div className="text-sm text-gray-500">
              {isConnected ? 'Markets are currently in sync' : 'Waiting for DEX connections...'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Pair</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">DEX A</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">DEX B</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Profit</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Volume</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Confidence</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {arbitrageOpportunities.map((opp) => (
                  <tr key={opp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{opp.pair}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-white">{opp.dexA}</div>
                        <div className="text-gray-400 text-sm font-mono">${opp.priceA.toFixed(4)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-white">{opp.dexB}</div>
                        <div className="text-gray-400 text-sm font-mono">${opp.priceB.toFixed(4)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-400 font-bold">{opp.profitPercentage.toFixed(2)}%</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white font-mono">₳ {opp.volume.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        opp.confidence === 'High' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {opp.confidence}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Button 
                        size="sm" 
                        className="bg-crypto-primary hover:bg-crypto-secondary transition-colors"
                        onClick={() => handleExecuteArbitrage(opp.id)}
                      >
                        Execute
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DEX API Settings */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">DEX Integration Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Minimum Profit %</label>
            <input 
              type="number" 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary/50" 
              placeholder="1.0"
              defaultValue="1.0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Max Investment (ADA)</label>
            <input 
              type="number" 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary/50" 
              placeholder="1000"
              defaultValue="1000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Auto Execute</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary/50">
              <option value="off">Manual Only</option>
              <option value="high">High Confidence Only</option>
              <option value="all">All Opportunities</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
