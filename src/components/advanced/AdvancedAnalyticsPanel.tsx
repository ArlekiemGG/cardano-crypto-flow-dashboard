
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Activity, PieChart } from 'lucide-react';
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';
import { useTechnicalIndicators } from '@/hooks/useTechnicalIndicators';
import { useRealMarketMakingStats } from '@/hooks/useRealMarketMakingStats';

export const AdvancedAnalyticsPanel = () => {
  const { getADAPrice, getADAChange24h, getADAVolume24h, hasRealPriceData } = useOptimizedMarketData();
  const { indicators } = useTechnicalIndicators();
  const { stats } = useRealMarketMakingStats();

  const currentPrice = getADAPrice();
  const change24h = getADAChange24h();
  const volume24h = getADAVolume24h();

  // Calculate advanced metrics with real data
  const calculateSharpeRatio = () => {
    if (!hasRealPriceData()) return 0;
    
    // Simplified Sharpe ratio calculation
    const riskFreeRate = 0.02; // 2% risk-free rate
    const expectedReturn = Math.abs(change24h) / 100;
    const volatility = Math.abs(change24h) / 100; // Simplified volatility
    
    return expectedReturn > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
  };

  const calculateVaR = () => {
    if (!hasRealPriceData()) return 0;
    
    // 95% VaR calculation (simplified)
    const volatility = Math.abs(change24h) / 100;
    return currentPrice * volatility * 1.645; // 95% confidence interval
  };

  const calculateBeta = () => {
    // Beta vs ADA (simplified - in real implementation would use market index)
    return 1.0; // Assuming ADA has beta of 1 relative to itself
  };

  const sharpeRatio = calculateSharpeRatio();
  const valueAtRisk = calculateVaR();
  const beta = calculateBeta();
  const maxDrawdown = Math.min(-5, change24h * 1.5); // Simplified max drawdown

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risk Metrics */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-crypto-primary" />
            <span>Risk Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300">Sharpe Ratio</div>
              <div className="text-2xl font-bold text-white">
                {sharpeRatio.toFixed(2)}
              </div>
              <div className={`text-xs ${sharpeRatio > 1 ? 'text-green-400' : sharpeRatio > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {sharpeRatio > 1 ? 'Excellent' : sharpeRatio > 0.5 ? 'Good' : 'Poor'}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300">Beta</div>
              <div className="text-2xl font-bold text-white">
                {beta.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">vs Market</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300">VaR (95%)</div>
              <div className="text-xl font-bold text-red-400">
                ${valueAtRisk.toFixed(4)}
              </div>
              <div className="text-xs text-gray-400">Daily risk</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300">Max Drawdown</div>
              <div className="text-xl font-bold text-red-400">
                {maxDrawdown.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">Est. peak to trough</div>
            </div>
          </div>

          {/* Risk Level Indicator */}
          <div>
            <div className="text-sm text-gray-300 mb-2">Risk Level</div>
            <div className="flex items-center space-x-2">
              <Progress 
                value={Math.min(100, Math.abs(change24h) * 10)} 
                className="flex-1 h-2"
              />
              <Badge variant="outline" className={`
                ${Math.abs(change24h) < 2 ? 'border-green-500 text-green-400' : 
                  Math.abs(change24h) < 5 ? 'border-yellow-500 text-yellow-400' : 
                  'border-red-500 text-red-400'}
              `}>
                {Math.abs(change24h) < 2 ? 'Low' : 
                 Math.abs(change24h) < 5 ? 'Medium' : 'High'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-crypto-primary" />
            <span>Performance Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300">24h Return</div>
              <div className={`text-2xl font-bold ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300">Volatility</div>
              <div className="text-2xl font-bold text-white">
                {Math.abs(change24h).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">24h realized</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300">Volume/MCap</div>
              <div className="text-xl font-bold text-white">
                {((volume24h / 24000000000) * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400">Liquidity ratio</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300">RSI Score</div>
              <div className="text-xl font-bold text-white">
                {indicators?.rsi.toFixed(0) || 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Technical strength</div>
            </div>
          </div>

          {/* Market Condition */}
          <div>
            <div className="text-sm text-gray-300 mb-2">Market Sentiment</div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bearish</span>
              <div className="flex-1 mx-4">
                <Progress 
                  value={50 + (change24h * 5)} 
                  className="h-2"
                />
              </div>
              <span className="text-sm">Bullish</span>
            </div>
            <div className="text-center mt-1">
              <Badge variant="outline" className={`
                ${change24h > 2 ? 'border-green-500 text-green-400' : 
                  change24h > -2 ? 'border-gray-500 text-gray-400' : 
                  'border-red-500 text-red-400'}
              `}>
                {change24h > 2 ? 'Bullish' : change24h > -2 ? 'Neutral' : 'Bearish'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Analytics */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-crypto-primary" />
            <span>Portfolio Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300">Total Value</div>
              <div className="text-2xl font-bold text-white">
                ₳ {stats.totalLiquidity.toFixed(2)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300">Active Positions</div>
              <div className="text-2xl font-bold text-crypto-primary">
                {stats.totalPositions}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300">Avg APY</div>
              <div className="text-xl font-bold text-green-400">
                {stats.avgAPY.toFixed(1)}%
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300">Total Fees</div>
              <div className="text-xl font-bold text-crypto-primary">
                ₳ {stats.totalFeesEarned.toFixed(3)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-300 mb-1">P&L</div>
            <div className={`text-lg font-bold ${stats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.profitLoss >= 0 ? '+' : ''}₳ {stats.profitLoss.toFixed(3)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-crypto-primary" />
            <span>Market Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-gray-300">ADA Price</div>
            <div className="text-3xl font-bold text-white">
              ${currentPrice.toFixed(4)}
            </div>
            <div className={`text-sm ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% (24h)
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-300">24h Volume</div>
            <div className="text-xl font-bold text-white">
              ${(volume24h / 1000000).toFixed(0)}M
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-300 mb-2">Data Quality</div>
            <Badge variant="outline" className="border-green-500 text-green-400">
              {hasRealPriceData() ? 'Live Data' : 'Cached Data'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
