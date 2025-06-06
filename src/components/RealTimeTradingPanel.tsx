
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
    isAutoScanning,
    executingTrades,
    getExecutableOpportunities
  } = useRealTimeArbitrage();

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
    if (isAutoScanning) {
      stopAutoScanning();
      toast.info('Auto trading disabled');
    } else {
      startAutoScanning(15); // Set to scan every 15 seconds
      toast.success('Auto trading enabled - monitoring for opportunities');
      
      // Force an immediate scan when auto-trading is turned on
      performRealScan().catch(error => {
        console.error('Error performing initial scan:', error);
      });
    }
  };

  const handleAutoExecuteAll = async () => {
    toast.info('Executing all high-confidence opportunities...');
    try {
      const result = await autoExecuteHighConfidence();
      if (result && result.executed > 0) {
        toast.success(`Executed ${result.successful} of ${result.executed} opportunities`);
      } else {
        toast.info('No executable opportunities found');
      }
    } catch (error) {
      toast.error('Error executing opportunities');
      console.error('Error in auto-execute:', error);
    }
  };

  const executableOpportunities = getExecutableOpportunities();

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <TradingControlPanel
        stats={stats}
        isScanning={isScanning}
        autoTrading={isAutoScanning}
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
