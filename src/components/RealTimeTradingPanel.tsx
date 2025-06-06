
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeArbitrage } from '@/hooks/useRealTimeArbitrage';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { toast } from 'sonner';
import { TradingControlPanel } from './trading/TradingControlPanel';
import { OpportunityTabs } from './trading/OpportunityTabs';

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

  const executableOpportunities = getExecutableOpportunities();

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <TradingControlPanel
        stats={stats}
        isScanning={isScanning}
        autoTrading={autoTrading}
        executableOpportunitiesCount={executableOpportunities.length}
        minProfitThreshold={minProfitThreshold}
        marketDataConnected={marketDataConnected}
        onAutoTradingToggle={handleAutoTrading}
        onManualScan={performRealScan}
        onExecuteAll={handleAutoExecuteAll}
        onMinProfitChange={setMinProfitThreshold}
      />

      {/* Opportunities Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Live Arbitrage Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityTabs
            opportunities={opportunities}
            executableOpportunities={executableOpportunities}
            highConfidenceCount={stats.highConfidenceCount}
            onExecute={handleExecuteTrade}
            executingTrades={executingTrades}
          />
        </CardContent>
      </Card>
    </div>
  );
};
