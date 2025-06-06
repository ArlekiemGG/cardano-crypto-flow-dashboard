
import { Button } from '@/components/ui/button';
import { Play, Pause, Zap } from 'lucide-react';

interface TradingControlButtonsProps {
  autoTrading: boolean;
  isScanning: boolean;
  executableOpportunitiesCount: number;
  onAutoTradingToggle: () => void;
  onManualScan: () => void;
  onExecuteAll: () => void;
}

export const TradingControlButtons = ({
  autoTrading,
  isScanning,
  executableOpportunitiesCount,
  onAutoTradingToggle,
  onManualScan,
  onExecuteAll
}: TradingControlButtonsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button
        onClick={onAutoTradingToggle}
        className={`${autoTrading 
          ? 'bg-red-600 hover:bg-red-700' 
          : 'bg-crypto-primary hover:bg-crypto-secondary'
        }`}
      >
        {autoTrading ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
        {autoTrading ? 'Stop Auto Trading' : 'Start Auto Trading'}
      </Button>

      <Button
        onClick={onManualScan}
        variant="outline"
        disabled={isScanning}
        className="border-crypto-primary/30 text-crypto-primary hover:bg-crypto-primary/10"
      >
        {isScanning ? 'Scanning...' : 'Manual Scan'}
      </Button>

      <Button
        onClick={onExecuteAll}
        disabled={executableOpportunitiesCount === 0}
        className="bg-gradient-to-r from-crypto-profit to-crypto-success hover:from-crypto-success hover:to-crypto-profit"
      >
        <Zap className="h-4 w-4 mr-2" />
        Execute All ({executableOpportunitiesCount})
      </Button>
    </div>
  );
};
