
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Play, 
  Pause, 
  RefreshCw
} from 'lucide-react';

interface ArbitrageControlPanelProps {
  isScanning: boolean;
  isAutoScanning: boolean;
  totalOpportunities: number;
  highConfidenceOpportunities: number;
  avgProfitPercentage: number;
  totalPotentialProfit: number;
  lastScan: Date;
  scanInterval: number;
  successRate: number;
  onAutoScanToggle: () => void;
  onManualScan: () => void;
}

export const ArbitrageControlPanel = ({
  isScanning,
  isAutoScanning,
  totalOpportunities,
  highConfidenceOpportunities,
  avgProfitPercentage,
  totalPotentialProfit,
  lastScan,
  scanInterval,
  successRate,
  onAutoScanToggle,
  onManualScan
}: ArbitrageControlPanelProps) => {
  return (
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
              onClick={onAutoScanToggle}
              variant="outline"
              size="sm"
              className={`border-crypto-primary/50 ${isAutoScanning ? 'bg-crypto-primary/20' : ''}`}
            >
              {isAutoScanning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isAutoScanning ? 'Auto ON' : 'Auto OFF'}
            </Button>
            <Button
              onClick={onManualScan}
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
          Success rate: {successRate.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
};
