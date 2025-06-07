
import { useRealTimeData } from "@/hooks/useRealTimeData"
import { useRealTimeArbitrage } from "@/hooks/useRealTimeArbitrage"
import { useArbitrageStats } from "@/hooks/useArbitrageStats"
import { usePortfolioCalculations } from "@/hooks/usePortfolioCalculations"
import { LiveArbitrageOpportunities } from "@/components/LiveArbitrageOpportunities"
import { DEXConnectionStatus } from "@/components/DEXConnectionStatus"
import { HeroSection } from "@/components/dashboard/HeroSection"
import { MetricsGrid } from "@/components/dashboard/MetricsGrid"
import { ComprehensiveDiagnosticsDashboard } from "@/components/diagnostics/ComprehensiveDiagnosticsDashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/contexts/ModernWalletContext"
import { useMemo } from "react"
import { Zap, Activity } from "lucide-react"
import { useUnifiedMarketData } from "@/hooks/useUnifiedMarketData"

export default function Dashboard() {
  const { marketData, isConnected } = useRealTimeData()
  const { 
    opportunities,
    stats 
  } = useRealTimeArbitrage()
  const { balance } = useWallet()
  
  const arbitrageStats = useArbitrageStats(opportunities, stats)
  const portfolioCalculations = usePortfolioCalculations(marketData, balance)
  
  // Use unified market data for real-time information
  const { 
    getTotalDexVolume24h,
    getADAPrice,
    getADAChange24h,
    isRealDataAvailable,
    dataSource 
  } = useUnifiedMarketData()
  
  const totalDexVolume = getTotalDexVolume24h()
  const adaPrice = getADAPrice()
  const adaChange = getADAChange24h()
  const hasRealData = isRealDataAvailable()

  const marketStats = useMemo(() => {
    const totalVolume = marketData.reduce((sum, data) => sum + (data.volume24h || 0), 0)

    return {
      totalVolume24h: totalVolume
    }
  }, [marketData])

  return (
    <div className="space-y-6">
      {/* Hero Section with Real Data */}
      <HeroSection 
        marketData={marketData}
        isConnected={isConnected}
        stats={stats}
      />

      {/* Enhanced Metrics Grid with Real Data */}
      <MetricsGrid
        portfolioValue={portfolioCalculations.portfolioValue}
        dailyPnL={portfolioCalculations.dailyPnL}
        totalOpportunities={arbitrageStats.totalOpportunities}
        highConfidenceOpportunities={arbitrageStats.highConfidenceOpportunities}
        totalPotentialProfit={arbitrageStats.totalPotentialProfit}
        avgProfitPercentage={arbitrageStats.avgProfitPercentage}
        totalVolume24h={totalDexVolume}
      />

      {/* Real-time Data Quality Indicator */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${hasRealData ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
              <div>
                <div className="font-medium text-white">
                  Estado de APIs: {hasRealData ? 'Datos en Vivo' : 'Datos Parciales'}
                </div>
                <div className="text-sm text-gray-400">
                  Fuente: {dataSource === 'defillama' ? 'DeFiLlama + CoinGecko' : 
                          dataSource === 'mixed' ? 'APIs Mixtas' : 'Cache Local'}
                </div>
              </div>
            </div>
            
            {adaPrice > 0 && (
              <div className="text-right">
                <div className="font-mono text-lg text-crypto-primary">
                  ADA: ${adaPrice.toFixed(4)}
                </div>
                <div className={`text-sm ${adaChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {adaChange >= 0 ? '+' : ''}{adaChange.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-black/40">
          <TabsTrigger value="overview" className="data-[state=active]:bg-crypto-primary">
            Vista General
          </TabsTrigger>
          <TabsTrigger value="trading" className="data-[state=active]:bg-crypto-primary">
            Trading
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="data-[state=active]:bg-crypto-primary">
            Diagnósticos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Live Data Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveArbitrageOpportunities />
            <DEXConnectionStatus />
          </div>
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          {/* Real-Time Trading Panel */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-crypto-primary" />
                  <span>Oportunidades de Trading en Vivo</span>
                </span>
                <span className="text-sm text-gray-400">
                  {arbitrageStats.totalOpportunities} oportunidades detectadas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-crypto-primary">{arbitrageStats.totalOpportunities}</div>
                  <div className="text-sm text-gray-400">Total Oportunidades</div>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-green-400">{arbitrageStats.highConfidenceOpportunities}</div>
                  <div className="text-sm text-gray-400">Alta Confianza</div>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-crypto-profit">₳ {arbitrageStats.totalPotentialProfit.toFixed(1)}</div>
                  <div className="text-sm text-gray-400">Ganancia Potencial</div>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-crypto-secondary">{arbitrageStats.avgProfitPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Ganancia Promedio</div>
                </div>
              </div>
              
              <LiveArbitrageOpportunities />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          {/* Comprehensive Diagnostics */}
          <ComprehensiveDiagnosticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
