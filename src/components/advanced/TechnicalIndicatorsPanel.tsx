
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useTechnicalIndicators } from '@/hooks/useTechnicalIndicators';

export const TechnicalIndicatorsPanel = () => {
  const { indicators, isLoading, hasData } = useTechnicalIndicators();

  if (isLoading || !hasData) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-crypto-primary" />
            <span>Technical Indicators</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">
            Loading technical analysis...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!indicators) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">
            Insufficient data for analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-400 border-green-500';
      case 'SELL': return 'text-red-400 border-red-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="h-4 w-4" />;
      case 'SELL': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getRSILevel = (rsi: number) => {
    if (rsi > 70) return { text: 'Overbought', color: 'text-red-400' };
    if (rsi < 30) return { text: 'Oversold', color: 'text-green-400' };
    return { text: 'Neutral', color: 'text-gray-400' };
  };

  const rsiLevel = getRSILevel(indicators.rsi);

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-crypto-primary" />
            <span>Technical Analysis - ADA</span>
          </div>
          
          <Badge variant="outline" className={`${getSignalColor(indicators.signal)}`}>
            {getSignalIcon(indicators.signal)}
            <span className="ml-1">{indicators.signal}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Signal Strength */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Signal Strength</span>
            <span className="text-sm text-crypto-primary">{(indicators.strength * 100).toFixed(0)}%</span>
          </div>
          <Progress 
            value={indicators.strength * 100} 
            className="h-2"
          />
        </div>

        {/* RSI */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-300 mb-1">RSI (14)</div>
            <div className="text-xl font-bold text-white">
              {indicators.rsi.toFixed(1)}
            </div>
            <div className={`text-xs ${rsiLevel.color}`}>
              {rsiLevel.text}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-300 mb-1">MACD</div>
            <div className="text-xl font-bold text-white">
              {indicators.macd.MACD.toFixed(4)}
            </div>
            <div className={`text-xs ${indicators.macd.MACD > indicators.macd.signal ? 'text-green-400' : 'text-red-400'}`}>
              {indicators.macd.MACD > indicators.macd.signal ? 'Bullish' : 'Bearish'}
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div>
          <div className="text-sm text-gray-300 mb-2">Moving Averages</div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-gray-400">SMA 20</div>
              <div className="text-white font-semibold">${indicators.sma20.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-gray-400">SMA 50</div>
              <div className="text-white font-semibold">${indicators.sma50.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-gray-400">EMA 20</div>
              <div className="text-white font-semibold">${indicators.ema20.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div>
          <div className="text-sm text-gray-300 mb-2">Bollinger Bands</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Upper</span>
              <span className="text-white">${indicators.bollingerBands.upper.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Middle</span>
              <span className="text-white">${indicators.bollingerBands.middle.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lower</span>
              <span className="text-white">${indicators.bollingerBands.lower.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Trading Recommendation */}
        <div className="border-t border-white/10 pt-4">
          <div className="text-sm text-gray-300 mb-2">Recommendation</div>
          <div className="text-sm text-gray-400">
            Based on technical analysis, the current signal is <strong className={getSignalColor(indicators.signal).replace('border-', 'text-')}>{indicators.signal}</strong> with {(indicators.strength * 100).toFixed(0)}% confidence.
            {indicators.signal === 'BUY' && ' Consider entering a long position.'}
            {indicators.signal === 'SELL' && ' Consider reducing exposure or shorting.'}
            {indicators.signal === 'HOLD' && ' Wait for clearer signals before taking action.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
