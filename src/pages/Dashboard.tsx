import { MetricCard } from "@/components/MetricCard"
import { BarChart3, TrendingUp, Bot, DollarSign, Activity, Zap } from "lucide-react"
import { useRealTimeData } from "@/hooks/useRealTimeData"
import { useRealTimeArbitrage } from "@/hooks/useRealTimeArbitrage"
import { useWallet } from "@/contexts/ModernWalletContext"
import { LiveArbitrageOpportunities } from "@/components/LiveArbitrageOpportunities"
import { DEXConnectionStatus } from "@/components/DEXConnectionStatus"
import { RealTimeTradingPanel } from "@/components/RealTimeTradingPanel"
import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { realTimeMarketDataService } from "@/services/realTimeMarketDataService"

export default function Dashboard() {
  const { marketData, isConnected } = useRealTimeData()
  const { 
    totalOpportunities, 
    highConfidenceOpportunities, 
    avgProfitPercentage, 
    totalPotentialProfit,
    stats 
  } = useRealTimeArbitrage()
  const { balance } = useWallet()
  
  const portfolioCalculations = useMemo(() => {
    const adaData = marketData.find(data => data.symbol === 'ADA')
    const adaPrice = adaData?.price || 0.63
    const realPortfolioValue = balance * adaPrice
    const dailyChange = adaData?.change24h || 0
    const dailyPnL = realPortfolioValue * (dailyChange / 100)
    
    return {
      portfolioValue: realPortfolioValue,
      dailyPnL,
      adaPrice
    }
  }, [marketData, balance])

  const marketStats = useMemo(() => {
    const allPrices = realTimeMarketDataService.getCurrentPrices()
    const totalVolume = allPrices.reduce((sum, price) => sum + price.volume24h, 0)
    const activePairs = new Set(allPrices.map(price => price.pair)).size
    const dexCount = new Set(allPrices.map(price => price.dex)).size

    return {
      totalVolume24h: totalVolume,
      activePairs,
      dexCount
    }
  }, [marketData]) // Only recalculate when marketData changes

  // Fix connection health state to match what the service returns
  const [connectionHealth, setConnectionHealth] = useState({
    muesliswap: false,
    defiLlama: false,
    taptools: false,
    coingecko: false
  })

  // Update connection health periodically
  useEffect(() => {
    const updateHealth = () => {
      const health = realTimeMarketDataService.getConnectionHealth()
      setConnectionHealth(health)
    }

    updateHealth()
    const interval = setInterval(updateHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const connectedDEXs = Object.values(connectionHealth).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="glass rounded-2xl p-8 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-crypto-primary to-crypto-secondary bg-clip-text text-transparent">
              Cardano Pro Trading Suite
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Real-time automated trading with live DEX integration, arbitrage detection, and professional portfolio management on Cardano.
            </p>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? `${connectedDEXs}/4 DEXs Connected` : 'Connecting to DEXs...'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Last scan: {stats.lastScanTime?.toLocaleTimeString() || 'Never'}
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0">
            <div className="p-6 rounded-xl bg-gradient-to-br from-crypto-primary/20 to-crypto-secondary/20 border border-crypto-primary/30 glow">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">₳ {balance.toFixed(3)}</div>
                <div className="text-crypto-primary text-sm">Wallet Balance</div>
                <div className="text-xs text-gray-400 mt-1">
                  ${portfolioCalculations.portfolioValue.toFixed(2)} USD
                </div>
                <div className={`text-xs mt-1 ${portfolioCalculations.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioCalculations.dailyPnL >= 0 ? '+' : ''}${portfolioCalculations.dailyPnL.toFixed(2)} (24h)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Portfolio Value"
          value={`$${portfolioCalculations.portfolioValue.toFixed(2)}`}
          change={`${portfolioCalculations.dailyPnL >= 0 ? '+' : ''}$${Math.abs(portfolioCalculations.dailyPnL).toFixed(2)}`}
          changeType={portfolioCalculations.dailyPnL >= 0 ? "positive" : "negative"}
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
          title="Active DEX Pairs"
          value={marketStats.activePairs.toString()}
          change="Real-time data"
          changeType="positive"
          icon={Activity}
          description="Live trading pairs across DEXs"
          gradient="gradient-secondary"
        />
        
        <MetricCard
          title="24h DEX Volume"
          value={`$${(marketStats.totalVolume24h / 1000000).toFixed(1)}M`}
          change="All tracked DEXs"
          changeType="positive"
          icon={BarChart3}
          description="Total volume across platforms"
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Connected DEXs"
          value={`${connectedDEXs}/4`}
          change="MuesliSwap, DeFiLlama, TapTools..."
          changeType={connectedDEXs > 2 ? "positive" : "negative"}
          icon={Bot}
          description="Live DEX API connections"
          gradient="gradient-primary"
        />
      </div>

      {/* Real-Time Trading Panel Preview */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-crypto-primary" />
              <span>Live Trading Opportunities</span>
            </span>
            <span className="text-sm text-gray-400">
              {totalOpportunities} opportunities detected
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-crypto-primary">{totalOpportunities}</div>
              <div className="text-sm text-gray-400">Total Opportunities</div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-green-400">{highConfidenceOpportunities}</div>
              <div className="text-sm text-gray-400">High Confidence</div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-crypto-profit">₳ {totalPotentialProfit.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Potential Profit</div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-crypto-secondary">{avgProfitPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Avg Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveArbitrageOpportunities />
        <DEXConnectionStatus />
      </div>

      {/* Real Market Data Section */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Live Market Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketData.slice(0, 6).map((data, index) => (
            <div key={`${data.symbol}-${index}`} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{data.symbol}</span>
                <span className={`text-sm ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-crypto-primary font-mono text-lg">
                ${data.price.toFixed(4)}
              </div>
              <div className="text-xs text-gray-400">
                Vol: ${(data.volume24h / 1000).toFixed(0)}K
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
