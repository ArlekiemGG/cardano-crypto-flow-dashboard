
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export const TradingViewChart = ({ 
  symbol = "BINANCE:ADAUSDT", 
  interval = "1H",
  theme = "dark",
  height = 400 
}: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const { getADAPrice, getADAChange24h, hasRealPriceData } = useOptimizedMarketData();

  // Generate realistic chart data since we can't use actual TradingView widget
  useEffect(() => {
    const generateChartData = () => {
      const currentPrice = getADAPrice();
      if (!currentPrice) return [];

      const data = [];
      const now = new Date();
      
      // Generate 100 data points going back in time
      for (let i = 99; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 3600000)); // 1 hour intervals
        
        // Generate realistic OHLC data with some volatility
        const basePrice = currentPrice * (1 + ((Math.random() - 0.5) * 0.02)); // ±1% variation
        const high = basePrice * (1 + Math.random() * 0.01); // Up to 1% higher
        const low = basePrice * (1 - Math.random() * 0.01); // Up to 1% lower
        const open = basePrice * (0.995 + Math.random() * 0.01); // Small variation
        const close = basePrice;
        const volume = Math.random() * 1000000 + 500000; // Random volume
        
        data.push({
          time: time.toISOString(),
          open,
          high,
          low,
          close,
          volume
        });
      }
      
      return data;
    };

    if (hasRealPriceData()) {
      const data = generateChartData();
      setChartData(data);
      setIsLoading(false);
    }
  }, [getADAPrice, hasRealPriceData]);

  const currentPrice = getADAPrice();
  const change24h = getADAChange24h();

  const refreshChart = () => {
    setIsLoading(true);
    // Simulate refresh delay
    setTimeout(() => {
      const data = chartData.map(item => ({
        ...item,
        close: item.close * (1 + ((Math.random() - 0.5) * 0.001)) // Small price movements
      }));
      setChartData(data);
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-crypto-primary" />
            <span>Advanced Price Chart</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: height }}>
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-crypto-primary animate-spin mx-auto mb-2" />
              <div className="text-gray-400">Loading advanced chart...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-crypto-primary" />
            <span>Advanced Price Chart - ADA/USDT</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={`${
              change24h >= 0 ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'
            }`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </Badge>
            
            <Badge variant="outline" className="border-crypto-primary text-crypto-primary">
              ${currentPrice.toFixed(4)}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChart}
              className="border-white/20 hover:bg-white/10"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Chart Container */}
          <div 
            ref={chartContainerRef}
            className="bg-black/20 rounded-lg border border-white/10 p-4"
            style={{ height: height }}
          >
            {/* Simulated Chart Display */}
            <div className="grid grid-cols-12 gap-1 h-full">
              {chartData.slice(-50).map((candle, index) => {
                const isGreen = candle.close >= candle.open;
                const bodyHeight = Math.abs(candle.close - candle.open) / candle.high * 100;
                const wickTop = (candle.high - Math.max(candle.open, candle.close)) / candle.high * 100;
                const wickBottom = (Math.min(candle.open, candle.close) - candle.low) / candle.high * 100;
                
                return (
                  <div key={index} className="flex flex-col justify-end h-full">
                    {/* Top wick */}
                    <div 
                      className={`w-0.5 mx-auto ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                      style={{ height: `${wickTop}%` }}
                    ></div>
                    
                    {/* Candle body */}
                    <div 
                      className={`w-2 mx-auto ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                      style={{ height: `${Math.max(bodyHeight, 2)}%` }}
                    ></div>
                    
                    {/* Bottom wick */}
                    <div 
                      className={`w-0.5 mx-auto ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                      style={{ height: `${wickBottom}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>
            
            {/* Chart Info Overlay */}
            <div className="absolute top-4 left-4 bg-black/40 rounded p-2 text-xs">
              <div className="text-gray-300">OHLC Data (Latest)</div>
              {chartData.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>O: ${chartData[chartData.length - 1]?.open.toFixed(4)}</div>
                  <div>H: ${chartData[chartData.length - 1]?.high.toFixed(4)}</div>
                  <div>L: ${chartData[chartData.length - 1]?.low.toFixed(4)}</div>
                  <div>C: ${chartData[chartData.length - 1]?.close.toFixed(4)}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart Controls */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex space-x-2">
              {['1m', '5m', '15m', '1H', '4H', '1D'].map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={interval === timeframe ? "default" : "outline"}
                  size="sm"
                  className={`text-xs ${
                    interval === timeframe 
                      ? 'bg-crypto-primary text-black' 
                      : 'border-white/20 hover:bg-white/10'
                  }`}
                >
                  {timeframe}
                </Button>
              ))}
            </div>
            
            <div className="text-xs text-gray-400">
              Real-time data simulation • Last update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
