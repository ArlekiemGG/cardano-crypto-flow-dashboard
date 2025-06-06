
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeArbitrage } from '@/hooks/useRealTimeArbitrage';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { toast } from 'sonner';
import { TradingControlPanel } from './trading/TradingControlPanel';
import { OpportunityTabs } from './trading/OpportunityTabs';
import { AlertTriangle, DollarSign } from 'lucide-react';

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

  const [minProfitThreshold, setMinProfitThreshold] = useState(5.0); // Higher threshold for real trading
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
      // Show warning for real trading
      const confirmed = window.confirm(
        '⚠️ WARNING: This will execute a REAL trade with your connected wallet. ' +
        'Real ADA will be spent and you may lose money. Continue?'
      );

      if (!confirmed) {
        toast.info('Trade execution cancelled by user');
        return;
      }

      toast.info('🚀 Executing REAL arbitrage trade...', {
        description: 'This may take 2-5 minutes to complete both transactions'
      });

      const result = await executeArbitrage(opportunityId);
      
      if (result.success) {
        toast.success(`✅ REAL TRADE EXECUTED SUCCESSFULLY! Profit: ${result.actualProfit?.toFixed(4)} ADA`, {
          description: `Buy TX: ${result.buyTxHash?.slice(0, 16)}... | Sell TX: ${result.sellTxHash?.slice(0, 16)}...`,
          duration: 10000
        });
      } else {
        toast.error(`❌ REAL TRADE FAILED: ${result.error}`, {
          description: result.buyTxHash ? 'Partial execution - check transaction history' : 'No transactions executed',
          duration: 8000
        });
      }
    } catch (error) {
      toast.error('❌ Real trade execution error occurred');
      console.error('Real trade execution error:', error);
    }
  };

  const handleAutoTrading = () => {
    if (isAutoScanning) {
      stopAutoScanning();
      toast.info('🛑 Auto REAL trading disabled');
    } else {
      // Show strong warning for auto real trading
      const confirmed = window.confirm(
        '🚨 CRITICAL WARNING: Auto REAL trading will automatically execute trades with your wallet! ' +
        'This can result in significant financial losses. Only enable if you fully understand the risks. Continue?'
      );

      if (!confirmed) {
        toast.info('Auto trading cancelled by user');
        return;
      }

      startAutoScanning(30); // Set to scan every 30 seconds for real trading
      toast.success('🤖 Auto REAL trading enabled - monitoring for HIGH confidence opportunities', {
        description: 'Only opportunities with >5 ADA profit will be auto-executed',
        duration: 8000
      });
      
      // Force an immediate scan when auto-trading is turned on
      performRealScan().catch(error => {
        console.error('Error performing initial scan:', error);
      });
    }
  };

  const handleAutoExecuteAll = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will execute ALL high-confidence opportunities as REAL trades. Continue?'
    );

    if (!confirmed) {
      toast.info('Bulk execution cancelled by user');
      return;
    }

    toast.info('🚀 Executing all HIGH confidence REAL opportunities...');
    try {
      const result = await autoExecuteHighConfidence();
      if (result && result.executed > 0) {
        toast.success(`✅ Executed ${result.successful} of ${result.executed} REAL opportunities`, {
          duration: 8000
        });
      } else {
        toast.info('No executable HIGH confidence opportunities found');
      }
    } catch (error) {
      toast.error('❌ Error executing REAL opportunities');
      console.error('Error in auto-execute:', error);
    }
  };

  const executableOpportunities = getExecutableOpportunities();

  return (
    <div className="space-y-6">
      {/* REAL TRADING WARNING */}
      <Card className="glass border-red-500/50 bg-red-500/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>REAL TRADING MODE ACTIVE</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <DollarSign className="h-6 w-6 text-red-400 mt-1" />
            <div className="text-red-300">
              <p className="font-semibold mb-2">⚠️ WARNING: Real money is at risk!</p>
              <ul className="text-sm space-y-1">
                <li>• All trades execute with REAL ADA from your connected wallet</li>
                <li>• Transactions are irreversible once confirmed on blockchain</li>
                <li>• Market conditions can change rapidly, causing losses</li>
                <li>• Only HIGH confidence opportunities (>5 ADA profit) are shown</li>
                <li>• Always verify opportunities before executing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span>REAL Trading Opportunities (HIGH Confidence Only)</span>
          </CardTitle>
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
