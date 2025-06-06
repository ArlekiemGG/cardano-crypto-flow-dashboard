
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Search, RefreshCw } from 'lucide-react';
import { TradingMetricsGrid } from './TradingMetricsGrid';
import { TradingControlButtons } from './TradingControlButtons';
import { TradingSettingsPanel } from './TradingSettingsPanel';
import { dataThrottlingService } from '@/services/dataThrottlingService';

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
  
  const handleForceRefresh = () => {
    console.log('🔄 Forzando refresh completo del sistema...');
    dataThrottlingService.forceReset();
    onManualScan();
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-crypto-primary" />
            <span>Control de Trading en Tiempo Real</span>
          </span>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleForceRefresh}
              size="sm"
              variant="outline"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Refresh
            </Button>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${marketDataConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className={`text-sm ${marketDataConnected ? 'text-green-400' : 'text-red-400'}`}>
                {marketDataConnected ? 'Datos en Vivo' : 'Conectando...'}
              </span>
            </div>
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

        {/* Panel de debug */}
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="text-sm text-yellow-400 mb-2">🔧 Panel de Debugging:</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div>• Sistema configurado con umbrales más permisivos</div>
            <div>• Profit mínimo: 0.5% (reducido desde 1.5%)</div>
            <div>• Volumen mínimo: 50 ADA (reducido desde 100 ADA)</div>
            <div>• Si no hay datos reales, se generan oportunidades de muestra</div>
            <div>• Usa "Force Refresh" si no aparecen oportunidades</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
