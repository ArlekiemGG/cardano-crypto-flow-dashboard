
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealTimeArbitrage } from '@/hooks/useRealTimeArbitrage';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { Play, Pause, Zap, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const RealTimeTradingPanel = () => {
  const {
    opportunities,
    stats,
    isScanning,
    executeArbitrage,
    autoExecuteHighConfidence,
    performRealScan,
    startAutoScanning,
    stopAutoScanning,
    executingTrades,
    getExecutableOpportunities
  } = useRealTimeArbitrage();

  const [autoTrading, setAutoTrading] = useState(false);
  const [minProfitThreshold, setMinProfitThreshold] = useState(1.5);
  const [maxSlippageLimit, setMaxSlippageLimit] = useState(3.0);
  const [marketDataConnected, setMarketDataConnected] = useState(false);

  // Check market data connection status
  useEffect(() => {
    const checkConnection = () => {
      setMarketDataConnected(realTimeMarketDataService.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteTrade = async (opportunityId: string) => {
    try {
      const result = await executeArbitrage(opportunityId);
      
      if (result.success) {
        toast.success(`Trade executed successfully! Profit: ${result.actualProfit?.toFixed(4)} ADA`, {
          description: `Transaction: ${result.txHash}`
        });
      } else {
        toast.error(`Trade failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Execution error occurred');
      console.error('Trade execution error:', error);
    }
  };

  const handleAutoTrading = () => {
    if (autoTrading) {
      setAutoTrading(false);
      stopAutoScanning();
      toast.info('Auto trading disabled');
    } else {
      setAutoTrading(true);
      startAutoScanning(15);
      toast.success('Auto trading enabled - monitoring for opportunities');
    }
  };

  const handleAutoExecuteAll = async () => {
    toast.info('Executing all high-confidence opportunities...');
    await autoExecuteHighConfidence();
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const executableOpportunities = getExecutableOpportunities();

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-crypto-primary" />
              <span>Real-Time Trading Control</span>
            </span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${marketDataConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className={`text-sm ${marketDataConnected ? 'text-green-400' : 'text-red-400'}`}>
                {marketDataConnected ? 'Live Data' : 'Connecting...'}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Opportunities</span>
                <TrendingUp className="h-4 w-4 text-crypto-primary" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalOpportunities}</div>
              <div className="text-sm text-gray-500">
                {stats.highConfidenceCount} high confidence
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg Profit</span>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">
                {stats.avgProfitPercentage.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500">Per opportunity</div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Potential Profit</span>
                <Zap className="h-4 w-4 text-crypto-profit" />
              </div>
              <div className="text-2xl font-bold text-crypto-profit">
                ₳ {stats.totalPotentialProfit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total available</div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Scan</span>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-sm font-mono text-white">
                {stats.lastScanTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-500">
                {isScanning ? 'Scanning...' : 'Idle'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={handleAutoTrading}
              className={`${autoTrading 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-crypto-primary hover:bg-crypto-secondary'
              }`}
            >
              {autoTrading ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {autoTrading ? 'Stop Auto Trading' : 'Start Auto Trading'}
            </Button>

            <Button
              onClick={performRealScan}
              variant="outline"
              disabled={isScanning}
              className="border-crypto-primary/30 text-crypto-primary hover:bg-crypto-primary/10"
            >
              {isScanning ? 'Scanning...' : 'Manual Scan'}
            </Button>

            <Button
              onClick={handleAutoExecuteAll}
              disabled={executableOpportunities.length === 0}
              className="bg-gradient-to-r from-crypto-profit to-crypto-success hover:from-crypto-success hover:to-crypto-profit"
            >
              <Zap className="h-4 w-4 mr-2" />
              Execute All ({executableOpportunities.length})
            </Button>

            <div className="flex items-center space-x-2 ml-auto">
              <label className="text-sm text-gray-400">Min Profit %:</label>
              <input
                type="number"
                value={minProfitThreshold}
                onChange={(e) => setMinProfitThreshold(parseFloat(e.target.value))}
                className="w-20 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
                step="0.1"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Live Arbitrage Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="all">All ({opportunities.length})</TabsTrigger>
              <TabsTrigger value="executable">Executable ({executableOpportunities.length})</TabsTrigger>
              <TabsTrigger value="high-confidence">High Confidence ({stats.highConfidenceCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <OpportunityTable 
                opportunities={opportunities}
                onExecute={handleExecuteTrade}
                executingTrades={executingTrades}
              />
            </TabsContent>

            <TabsContent value="executable" className="mt-6">
              <OpportunityTable 
                opportunities={executableOpportunities}
                onExecute={handleExecuteTrade}
                executingTrades={executingTrades}
              />
            </TabsContent>

            <TabsContent value="high-confidence" className="mt-6">
              <OpportunityTable 
                opportunities={opportunities.filter(opp => opp.confidence === 'HIGH')}
                onExecute={handleExecuteTrade}
                executingTrades={executingTrades}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Opportunity Table Component
const OpportunityTable = ({ 
  opportunities, 
  onExecute, 
  executingTrades 
}: { 
  opportunities: any[], 
  onExecute: (id: string) => void,
  executingTrades: Set<string>
}) => {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-400 mb-2">No opportunities found</div>
        <div className="text-sm text-gray-500">Markets are currently efficient or scanning in progress...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Pair</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Buy DEX</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Sell DEX</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Profit</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Volume</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Confidence</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => (
            <tr key={opp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 px-4">
                <span className="text-white font-medium">{opp.pair}</span>
              </td>
              <td className="py-4 px-4">
                <div>
                  <div className="text-white">{opp.buyDex}</div>
                  <div className="text-gray-400 text-sm font-mono">
                    {typeof opp.buyPrice === 'number' ? `$${opp.buyPrice.toFixed(4)}` : opp.buyPrice}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div>
                  <div className="text-white">{opp.sellDex}</div>
                  <div className="text-gray-400 text-sm font-mono">
                    {typeof opp.sellPrice === 'number' ? `$${opp.sellPrice.toFixed(4)}` : opp.sellPrice}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-green-400 font-bold">{opp.profitPercentage.toFixed(2)}%</div>
                <div className="text-xs text-gray-400">₳ {opp.profitADA.toFixed(2)}</div>
              </td>
              <td className="py-4 px-4">
                <span className="text-white font-mono">₳ {opp.volumeAvailable.toFixed(0)}</span>
              </td>
              <td className="py-4 px-4">
                <Badge className={`px-2 py-1 text-xs border ${getConfidenceBadgeColor(opp.confidence)}`}>
                  {opp.confidence}
                </Badge>
                {opp.executionReady && (
                  <div className="text-xs text-green-400 mt-1">✓ Ready</div>
                )}
              </td>
              <td className="py-4 px-4">
                <Button 
                  size="sm" 
                  onClick={() => onExecute(opp.id)}
                  disabled={executingTrades.has(opp.id)}
                  className="bg-crypto-primary hover:bg-crypto-secondary transition-colors disabled:opacity-50"
                >
                  {executingTrades.has(opp.id) ? 'Executing...' : 'Execute'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getConfidenceBadgeColor = (confidence: string) => {
  switch (confidence) {
    case 'HIGH': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'LOW': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};
