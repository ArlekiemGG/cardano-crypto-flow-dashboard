
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';

interface OrderBookEntry {
  price: number;
  volume: number;
  total: number;
  percentage: number;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercentage: number;
  lastPrice: number;
  volume24h: number;
}

export const OrderBook = ({ pair = "ADA/USDC" }: { pair?: string }) => {
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);
  const [selectedDepth, setSelectedDepth] = useState<number>(10);
  const { getADAPrice, getADAVolume24h, dexVolumes, isLoading } = useOptimizedMarketData();

  useEffect(() => {
    const generateOrderBookData = (): OrderBookData => {
      const currentPrice = getADAPrice();
      const volume24h = getADAVolume24h();
      
      if (!currentPrice || currentPrice === 0) {
        return {
          bids: [],
          asks: [],
          spread: 0,
          spreadPercentage: 0,
          lastPrice: 0,
          volume24h: 0
        };
      }

      // Generate realistic bid/ask data based on current price
      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];
      
      let cumulativeBidVolume = 0;
      let cumulativeAskVolume = 0;
      
      // Generate bids (below current price)
      for (let i = 0; i < selectedDepth; i++) {
        const priceOffset = (i + 1) * (currentPrice * 0.001); // 0.1% steps
        const price = currentPrice - priceOffset;
        const volume = Math.random() * 10000 + 1000; // Random volume between 1k-11k
        cumulativeBidVolume += volume;
        
        bids.push({
          price,
          volume,
          total: cumulativeBidVolume,
          percentage: 0 // Will calculate after
        });
      }
      
      // Generate asks (above current price)
      for (let i = 0; i < selectedDepth; i++) {
        const priceOffset = (i + 1) * (currentPrice * 0.001); // 0.1% steps
        const price = currentPrice + priceOffset;
        const volume = Math.random() * 10000 + 1000; // Random volume between 1k-11k
        cumulativeAskVolume += volume;
        
        asks.push({
          price,
          volume,
          total: cumulativeAskVolume,
          percentage: 0 // Will calculate after
        });
      }
      
      // Calculate percentages based on max volume
      const maxVolume = Math.max(
        Math.max(...bids.map(b => b.volume)),
        Math.max(...asks.map(a => a.volume))
      );
      
      bids.forEach(bid => {
        bid.percentage = (bid.volume / maxVolume) * 100;
      });
      
      asks.forEach(ask => {
        ask.percentage = (ask.volume / maxVolume) * 100;
      });
      
      // Calculate spread
      const bestBid = bids[0]?.price || 0;
      const bestAsk = asks[0]?.price || 0;
      const spread = bestAsk - bestBid;
      const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;
      
      return {
        bids: bids.reverse(), // Highest bids first
        asks,
        spread,
        spreadPercentage,
        lastPrice: currentPrice,
        volume24h
      };
    };

    if (!isLoading) {
      const data = generateOrderBookData();
      setOrderBookData(data);
    }
  }, [getADAPrice, getADAVolume24h, selectedDepth, isLoading]);

  const formatPrice = (price: number) => `$${price.toFixed(6)}`;
  const formatVolume = (volume: number) => `${(volume / 1000).toFixed(1)}K`;

  if (isLoading || !orderBookData) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-crypto-primary" />
            <span>Order Book - {pair}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading order book...</div>
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
            <span>Order Book - {pair}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={selectedDepth} 
              onChange={(e) => setSelectedDepth(Number(e.target.value))}
              className="bg-white/5 border border-white/10 text-white text-xs px-2 py-1 rounded"
            >
              <option value={5}>5 Levels</option>
              <option value={10}>10 Levels</option>
              <option value={20}>20 Levels</option>
            </select>
            
            <Badge variant="outline" className="border-crypto-primary text-crypto-primary">
              Spread: {orderBookData.spreadPercentage.toFixed(3)}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Market Summary */}
          <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-center">
              <div className="text-xs text-gray-400">Last Price</div>
              <div className="text-white font-mono font-bold">
                {formatPrice(orderBookData.lastPrice)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">24h Volume</div>
              <div className="text-crypto-primary font-mono">
                ${(orderBookData.volume24h / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Spread</div>
              <div className="text-yellow-400 font-mono">
                ${orderBookData.spread.toFixed(6)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Asks (Sell Orders) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-red-400 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Asks (Sell)
                </h4>
                <div className="text-xs text-gray-400">Vol {formatVolume(orderBookData.asks.reduce((sum, ask) => sum + ask.volume, 0))}</div>
              </div>
              
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {orderBookData.asks.slice().reverse().map((ask, index) => (
                  <div key={index} className="relative flex justify-between items-center p-1 text-xs hover:bg-red-500/10 rounded">
                    <div 
                      className="absolute left-0 top-0 h-full bg-red-500/20 rounded"
                      style={{ width: `${ask.percentage}%` }}
                    ></div>
                    <span className="relative z-10 text-red-400 font-mono">{formatPrice(ask.price)}</span>
                    <span className="relative z-10 text-white">{formatVolume(ask.volume)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bids (Buy Orders) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Bids (Buy)
                </h4>
                <div className="text-xs text-gray-400">Vol {formatVolume(orderBookData.bids.reduce((sum, bid) => sum + bid.volume, 0))}</div>
              </div>
              
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {orderBookData.bids.map((bid, index) => (
                  <div key={index} className="relative flex justify-between items-center p-1 text-xs hover:bg-green-500/10 rounded">
                    <div 
                      className="absolute left-0 top-0 h-full bg-green-500/20 rounded"
                      style={{ width: `${bid.percentage}%` }}
                    ></div>
                    <span className="relative z-10 text-green-400 font-mono">{formatPrice(bid.price)}</span>
                    <span className="relative z-10 text-white">{formatVolume(bid.volume)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
