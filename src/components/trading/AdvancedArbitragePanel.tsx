
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Activity,
  Target,
  Brain
} from 'lucide-react';
import { useRealTimeArbitrage } from '@/hooks/useRealTimeArbitrage';
import { useSpreadOptimization } from '@/hooks/useSpreadOptimization';
import { OrderBook } from './OrderBook';
import { TradingViewChart } from '../charts/TradingViewChart';
import { ArbitrageOpportunityList } from '../arbitrage/ArbitrageOpportunityList';

export const AdvancedArbitragePanel = () => {
  const [activeTab, setActiveTab] = useState('opportunities');
  const {
    opportunities,
    stats,
    isScanning,
    performRealScan,
    getTopOpportunities,
    totalOpportunities,
    highConfidenceOpportunities
  } = useRealTimeArbitrage();

  const {
    spreadAnalysis,
    marketConditions,
    isAnalyzing,
    performAnalysis,
    hasValidData
  } = useSpreadOptimization();

  const topOpportunities = getTopOpportunities(10);

  return (
    <div className="space-y-6">
      {/* Advanced Controls Header */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-crypto-primary" />
              <span>Advanced Arbitrage Intelligence</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="border-green-500 text-green-400">
                {totalOpportunities} Total
              </Badge>
              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                {highConfidenceOpportunities} High Confidence
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={performRealScan}
                disabled={isScanning}
                className="border-crypto-primary text-crypto-primary hover:bg-crypto-primary/10"
              >
                <Activity className="h-3 w-3 mr-1" />
                {isScanning ? 'Scanning...' : 'Deep Scan'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Advanced Panel */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/5">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="orderbook">Order Book</TabsTrigger>
          <TabsTrigger value="charts">Advanced Charts</TabsTrigger>
          <TabsTrigger value="optimization">Spread Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Market Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="mt-6">
          <ArbitrageOpportunityList
            opportunities={topOpportunities}
            isScanning={isScanning}
            onSimulate={(id) => console.log('Simulating:', id)}
          />
        </TabsContent>

        <TabsContent value="orderbook" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <OrderBook pair="ADA/USDC" />
            <OrderBook pair="ADA/DJED" />
          </div>
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TradingViewChart symbol="BINANCE:ADAUSDT" height={400} />
            <TradingViewChart symbol="BINANCE:ADABTC" height={400} />
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spread Analysis */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-crypto-primary" />
                  <span>Spread Optimization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-400">Analyzing market conditions...</div>
                  </div>
                ) : spreadAnalysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-xs text-gray-400">Optimal Spread</div>
                        <div className="text-lg font-bold text-crypto-primary">
                          {spreadAnalysis.spreadPercentage.toFixed(3)}%
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-xs text-gray-400">Profit Score</div>
                        <div className="text-lg font-bold text-green-400">
                          {spreadAnalysis.profitability.toFixed(0)}/100
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Optimal Bid:</span>
                        <span className="text-white font-mono">${spreadAnalysis.optimalBidPrice.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Optimal Ask:</span>
                        <span className="text-white font-mono">${spreadAnalysis.optimalAskPrice.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <Badge variant="outline" className={`${
                          spreadAnalysis.riskLevel === 'LOW' ? 'border-green-500 text-green-400' :
                          spreadAnalysis.riskLevel === 'MEDIUM' ? 'border-yellow-500 text-yellow-400' :
                          'border-red-500 text-red-400'
                        }`}>
                          {spreadAnalysis.riskLevel}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-xs text-blue-300 font-medium mb-1">AI Recommendation:</div>
                      <div className="text-sm text-blue-200">{spreadAnalysis.recommendation}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <Button onClick={performAnalysis} disabled={!hasValidData}>
                      <Settings className="h-4 w-4 mr-2" />
                      Analyze Spreads
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Conditions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-crypto-primary" />
                  <span>Market Conditions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marketConditions ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-xs text-gray-400">Market Trend</div>
                        <Badge variant="outline" className={`${
                          marketConditions.trend === 'BULLISH' ? 'border-green-500 text-green-400' :
                          marketConditions.trend === 'BEARISH' ? 'border-red-500 text-red-400' :
                          'border-yellow-500 text-yellow-400'
                        }`}>
                          {marketConditions.trend}
                        </Badge>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-xs text-gray-400">Volatility</div>
                        <div className="text-lg font-bold text-crypto-primary">
                          {marketConditions.volatility.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Support Level:</span>
                        <span className="text-green-400 font-mono">${marketConditions.support.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Resistance Level:</span>
                        <span className="text-red-400 font-mono">${marketConditions.resistance.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">24h Volume:</span>
                        <span className="text-crypto-primary font-mono">
                          ${(marketConditions.volume / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-400">No market data available</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Metrics */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-crypto-primary" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Success Rate:</span>
                    <span className="text-green-400 font-bold">{stats.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Profit:</span>
                    <span className="text-crypto-primary font-mono">
                      {stats.avgProfitPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Volume:</span>
                    <span className="text-white font-mono">
                      ₳ {(stats.totalVolume / 1000).toFixed(1)}K
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-yellow-400" />
                  <span>Risk Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Score:</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      Medium
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Drawdown:</span>
                    <span className="text-red-400">-2.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sharpe Ratio:</span>
                    <span className="text-green-400">1.42</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Health */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  <span>Market Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Liquidity Score:</span>
                    <span className="text-green-400">87/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Depth:</span>
                    <span className="text-crypto-primary">Deep</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Slippage Risk:</span>
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      Low
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
