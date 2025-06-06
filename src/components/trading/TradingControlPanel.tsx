
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { TradingMetricsGrid } from './TradingMetricsGrid';
import { TradingControlButtons } from './TradingControlButtons';
import { TradingSettingsPanel } from './TradingSettingsPanel';

interface TradingControlPanelProps {
  stats: {
    totalOpportunities: number;
    avgProfitPercentage: number;
    totalPotentialProfit: number;
    highConfidenceCount: number;
    lastScanTime: Date;
  };
  isScanning: boolean;
  autoTrading: boolean;
  executableOpportunitiesCount: number;
  minProfitThreshold: number;
  marketDataConnected: boolean;
  onAutoTradingToggle: () => void;
  onManualScan: () => void;
  onExecuteAll: () => void;
  onMinProfitChange: (value: number) => void;
}

export const TradingControlPanel = ({
  stats,
  isScanning,
  autoTrading,
  executableOpportunitiesCount,
  minProfitThreshold,
  marketDataConnected,
  onAutoTradingToggle,
  onManualScan,
  onExecuteAll,
  onMinProfitChange
}: TradingControlPanelProps) => {
  return (
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
        <TradingMetricsGrid stats={stats} isScanning={isScanning} />
        
        <div className="flex flex-wrap items-center gap-4">
          <TradingControlButtons
            autoTrading={autoTrading}
            isScanning={isScanning}
            executableOpportunitiesCount={executableOpportunitiesCount}
            onAutoTradingToggle={onAutoTradingToggle}
            onManualScan={onManualScan}
            onExecuteAll={onExecuteAll}
          />
          
          <TradingSettingsPanel
            minProfitThreshold={minProfitThreshold}
            onMinProfitChange={onMinProfitChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
