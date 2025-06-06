
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/contexts/ModernWalletContext';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3 } from 'lucide-react';

interface PortfolioHolding {
  symbol: string;
  amount: number;
  value: number;
  allocation: number;
  change24h: number;
  priceUSD: number;
}

interface TradeHistory {
  id: string;
  pair: string;
  trade_type: string;
  amount: number;
  profit_loss: number;
  timestamp: string;
  status: string;
  tx_hash: string | null;
}

export const RealTimePortfolio = () => {
  const { balance, isConnected, address } = useWallet();
  const { marketData } = useRealTimeData();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalValue: 0,
    dailyPnL: 0,
    weeklyPnL: 0,
    totalTrades: 0,
    winRate: 0,
    avgProfit: 0,
    sharpeRatio: 0
  });

  // Calculate portfolio metrics from real data
  useEffect(() => {
    if (!isConnected || !marketData.length) return;

    const calculatePortfolio = () => {
      const adaData = marketData.find(data => data.symbol === 'ADA');
      if (!adaData) return;

      // Calculate ADA holdings
      const adaValue = balance * adaData.price;
      const adaHolding: PortfolioHolding = {
        symbol: 'ADA',
        amount: balance,
        value: adaValue,
        allocation: 100, // For now, assuming only ADA
        change24h: adaData.change24h,
        priceUSD: adaData.price
      };

      setHoldings([adaHolding]);

      // Update portfolio metrics
      const dailyChange = adaValue * (adaData.change24h / 100);
      setPortfolioMetrics(prev => ({
        ...prev,
        totalValue: adaValue,
        dailyPnL: dailyChange
      }));
    };

    calculatePortfolio();
  }, [balance, marketData, isConnected]);

  // Fetch trade history
  useEffect(() => {
    if (!isConnected || !address) return;

    const fetchTradeHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('trade_history')
          .select('*')
          .eq('user_wallet', address)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching trade history:', error);
          return;
        }

        if (data) {
          setTradeHistory(data);
          
          // Calculate performance metrics
          const completedTrades = data.filter(trade => trade.status === 'completed');
          const totalTrades = completedTrades.length;
          const winningTrades = completedTrades.filter(trade => (trade.profit_loss || 0) > 0).length;
          const totalPnL = completedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
          const avgProfit = totalTrades > 0 ? totalPnL / totalTrades : 0;
          const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

          // Calculate weekly P&L (last 7 days)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const weeklyTrades = completedTrades.filter(trade => 
            new Date(trade.timestamp) >= weekAgo
          );
          const weeklyPnL = weeklyTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

          // Simple Sharpe ratio calculation (annualized)
          const avgDailyReturn = avgProfit / 365;
          const sharpeRatio = avgDailyReturn > 0 ? avgDailyReturn / 0.01 : 0; // Assuming 1% daily volatility

          setPortfolioMetrics(prev => ({
            ...prev,
            weeklyPnL,
            totalTrades,
            winRate,
            avgProfit,
            sharpeRatio
          }));
        }
      } catch (error) {
        console.error('Error fetching trade data:', error);
      }
    };

    fetchTradeHistory();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-400 mb-2">Wallet not connected</div>
          <div className="text-sm text-gray-500">Connect your wallet to view portfolio</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white">
                  ${portfolioMetrics.totalValue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-crypto-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">24h P&L</p>
                <p className={`text-2xl font-bold ${portfolioMetrics.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioMetrics.dailyPnL >= 0 ? '+' : ''}${portfolioMetrics.dailyPnL.toFixed(2)}
                </p>
              </div>
              {portfolioMetrics.dailyPnL >= 0 ? 
                <TrendingUp className="h-8 w-8 text-green-400" /> : 
                <TrendingDown className="h-8 w-8 text-red-400" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-white">
                  {portfolioMetrics.winRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-crypto-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Trades</p>
                <p className="text-2xl font-bold text-white">
                  {portfolioMetrics.totalTrades}
                </p>
              </div>
              <Activity className="h-8 w-8 text-crypto-profit" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Breakdown */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-crypto-primary" />
            <span>Current Holdings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holdings.map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-crypto-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-crypto-primary font-bold">{holding.symbol}</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{holding.symbol}</div>
                    <div className="text-gray-400 text-sm">{holding.amount.toFixed(6)} tokens</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">${holding.value.toFixed(2)}</div>
                  <div className={`text-sm ${holding.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-crypto-primary" />
            <span>Recent Trades</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tradeHistory.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-2">No trades yet</div>
              <div className="text-sm text-gray-500">Your trading history will appear here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {tradeHistory.slice(0, 10).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      trade.status === 'completed' ? 'bg-green-400' : 
                      trade.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <div className="text-white font-medium">{trade.pair}</div>
                      <div className="text-gray-400 text-sm capitalize">{trade.trade_type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      (trade.profit_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(trade.profit_loss || 0) >= 0 ? '+' : ''}₳ {(trade.profit_loss || 0).toFixed(4)}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {new Date(trade.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">{portfolioMetrics.avgProfit.toFixed(4)}</div>
              <div className="text-gray-400 text-sm">Avg Profit per Trade (ADA)</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">₳ {portfolioMetrics.weeklyPnL.toFixed(2)}</div>
              <div className="text-gray-400 text-sm">7-Day P&L</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">{portfolioMetrics.sharpeRatio.toFixed(2)}</div>
              <div className="text-gray-400 text-sm">Sharpe Ratio</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
