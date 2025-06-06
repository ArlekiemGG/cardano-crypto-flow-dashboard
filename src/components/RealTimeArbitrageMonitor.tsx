
import { useRealTimeArbitrage } from '@/hooks/useRealTimeArbitrage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  Shield, 
  Play, 
  Pause, 
  RefreshCw,
  Eye,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { useState } from 'react';

export const RealTimeArbitrageMonitor = () => {
  const {
    opportunities,
    stats,
    isScanning,
    lastScan,
    scanInterval,
    performScan,
    startAutoScan,
    stopAutoScan,
    simulateExecution,
    getTopOpportunities,
    totalOpportunities,
    highConfidenceOpportunities,
    avgProfitPercentage,
    totalPotentialProfit
  } = useRealTimeArbitrage();

  const [isAutoScanning, setIsAutoScanning] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const topOpportunities = getTopOpportunities(8);

  const handleAutoScanToggle = () => {
    if (isAutoScanning) {
      stopAutoScan();
      setIsAutoScanning(false);
    } else {
      startAutoScan(scanInterval);
      setIsAutoScanning(true);
    }
  };

  const handleSimulate = async (opportunityId: string) => {
    setSelectedOpportunity(opportunityId);
    const result = await simulateExecution(opportunityId);
    setSimulationResult(result);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return 'border-green-500 text-green-400 bg-green-500/10';
      case 'MEDIUM': return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
      case 'LOW': return 'border-red-500 text-red-400 bg-red-500/10';
      default: return 'border-gray-500 text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-crypto-primary" />
              <span>Real-Time Arbitrage Monitor</span>
              {isScanning && (
                <div className="flex items-center space-x-1 text-crypto-primary">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Scanning...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleAutoScanToggle}
                variant="outline"
                size="sm"
                className={`border-crypto-primary/50 ${isAutoScanning ? 'bg-crypto-primary/20' : ''}`}
              >
                {isAutoScanning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                {isAutoScanning ? 'Auto ON' : 'Auto OFF'}
              </Button>
              <Button
                onClick={performScan}
                disabled={isScanning}
                size="sm"
                className="bg-crypto-primary hover:bg-crypto-primary/80"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
                Scan Now
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-crypto-primary">{totalOpportunities}</div>
              <div className="text-sm text-gray-400">Total Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{highConfidenceOpportunities}</div>
              <div className="text-sm text-gray-400">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{avgProfitPercentage.toFixed(2)}%</div>
              <div className="text-sm text-gray-400">Avg Profit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">₳ {totalPotentialProfit.toFixed(0)}</div>
              <div className="text-sm text-gray-400">Total Potential</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400 text-center">
            Last scan: {lastScan.toLocaleTimeString()} | 
            Next scan in: {scanInterval}s intervals | 
            Success rate: {stats.successRate.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span>Top Arbitrage Opportunities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {topOpportunities.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {isScanning ? 'Scanning for opportunities...' : 'No arbitrage opportunities found'}
              </div>
            ) : (
              topOpportunities.map((opportunity) => (
                <div 
                  key={opportunity.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium text-white">{opportunity.pair}</div>
                      <div className="text-sm text-gray-400">
                        {opportunity.buyDex} → {opportunity.sellDex}
                      </div>
                      <div className="text-xs text-gray-500">
                        Volume: ₳ {opportunity.volumeAvailable.toFixed(0)} | 
                        Slippage: {opportunity.slippageRisk.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        +{opportunity.profitPercentage.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-400">
                        ₳ {opportunity.profitADA.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {opportunity.buyPrice.toFixed(4)} → {opportunity.sellPrice.toFixed(4)}
                      </div>
                    </div>

                    <Badge 
                      variant="outline" 
                      className={getConfidenceColor(opportunity.confidence)}
                    >
                      {opportunity.confidence}
                    </Badge>

                    <div className="flex flex-col space-y-1">
                      <Button
                        onClick={() => handleSimulate(opportunity.id)}
                        size="sm"
                        variant="outline"
                        className="border-crypto-primary/50 text-crypto-primary hover:bg-crypto-primary/10"
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        Simulate
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {Math.floor(opportunity.timeToExpiry / 60)}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {simulationResult && selectedOpportunity && (
        <Card className="glass border-crypto-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-crypto-primary" />
              <span>Trade Simulation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${simulationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {simulationResult.success ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-400">Success</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-crypto-primary">
                  ₳ {simulationResult.estimatedProfit?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-400">Est. Profit</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">
                  {simulationResult.estimatedSlippage?.toFixed(2) || '0.00'}%
                </div>
                <div className="text-sm text-gray-400">Est. Slippage</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">
                  {simulationResult.timeEstimate || 0}s
                </div>
                <div className="text-sm text-gray-400">Est. Time</div>
              </div>
            </div>
            
            {!simulationResult.success && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    Trade simulation failed. High slippage or insufficient liquidity detected.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Stats */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <span>7-Day Performance Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-lg font-bold text-white">{stats.totalOpportunities}</div>
              <div className="text-sm text-gray-400">Total Opportunities</div>
              <Progress value={Math.min(100, stats.totalOpportunities)} className="mt-2" />
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">{stats.avgProfitPercentage.toFixed(2)}%</div>
              <div className="text-sm text-gray-400">Avg Profit</div>
              <Progress value={Math.min(100, stats.avgProfitPercentage * 10)} className="mt-2" />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
              <Progress value={stats.successRate} className="mt-2" />
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">₳ {stats.totalVolume.toFixed(0)}</div>
              <div className="text-sm text-gray-400">Total Volume</div>
              <Progress value={Math.min(100, stats.totalVolume / 10000)} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
