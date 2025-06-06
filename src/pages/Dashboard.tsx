import { useRealTimeData } from "@/hooks/useRealTimeData"
import { useRealTimeArbitrage } from "@/hooks/useRealTimeArbitrage"
import { useArbitrageStats } from "@/hooks/useArbitrageStats"
import { usePortfolioCalculations } from "@/hooks/usePortfolioCalculations"
import { LiveArbitrageOpportunities } from "@/components/LiveArbitrageOpportunities"
import { DEXConnectionStatus } from "@/components/DEXConnectionStatus"
import { HeroSection } from "@/components/dashboard/HeroSection"
import { MetricsGrid } from "@/components/dashboard/MetricsGrid"
import { MarketDataSection } from "@/components/dashboard/MarketDataSection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/ModernWalletContext"
import { useMemo } from "react"
import { Zap } from "lucide-react"
import { useOptimizedMarketData } from "@/hooks/useOptimizedMarketData"
import { realTimeMarketDataService } from "@/services/realTimeMarketDataService"

export default function Dashboard() {
  const { marketData, isConnected } = useRealTimeData()
  const { 
    opportunities,
    stats 
  } = useRealTimeArbitrage()
  const { balance } = useWallet()
  
  const arbitrageStats = useArbitrageStats(opportunities, stats)
  const portfolioCalculations = usePortfolioCalculations(marketData, balance)
  
  // Use DeFiLlama data for DEX volume
  const { getTotalDexVolume24h } = useOptimizedMarketData()
  const totalDexVolume = getTotalDexVolume24h()

  const marketStats = useMemo(() => {
    const allPrices = realTimeMarketDataService.getCurrentPrices()
    const totalVolume = allPrices.reduce((sum, price) => sum + price.volume24h, 0)

    return {
      totalVolume24h: totalVolume
    }
  }, [marketData])

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection 
        marketData={marketData}
        isConnected={isConnected}
        stats={stats}
      />

      {/* Real-Time Metrics Grid */}
      <MetricsGrid
        portfolioValue={portfolioCalculations.portfolioValue}
        dailyPnL={portfolioCalculations.dailyPnL}
        totalOpportunities={arbitrageStats.totalOpportunities}
        highConfidenceOpportunities={arbitrageStats.highConfidenceOpportunities}
        totalPotentialProfit={arbitrageStats.totalPotentialProfit}
        avgProfitPercentage={arbitrageStats.avgProfitPercentage}
        totalVolume24h={totalDexVolume} // Use DeFiLlama DEX volume here
      />

      {/* Real-Time Trading Panel Preview */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-crypto-primary" />
              <span>Live Trading Opportunities</span>
            </span>
            <span className="text-sm text-gray-400">
              {arbitrageStats.totalOpportunities} opportunities detected
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-crypto-primary">{arbitrageStats.totalOpportunities}</div>
              <div className="text-sm text-gray-400">Total Opportunities</div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-green-400">{arbitrageStats.highConfidenceOpportunities}</div>
              <div className="text-sm text-gray-400">High Confidence</div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-crypto-profit">₳ {arbitrageStats.totalPotentialProfit.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Potential Profit</div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-crypto-secondary">{arbitrageStats.avgProfitPercentage.toFixed(1)}%</div>
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
      <MarketDataSection marketData={marketData} />
    </div>
  )
}
