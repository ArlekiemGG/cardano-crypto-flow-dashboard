
import { useRealTimeArbitrage } from '@/hooks/useRealTimeArbitrage';
import { useState } from 'react';
import { ArbitrageControlPanel } from './arbitrage/ArbitrageControlPanel';
import { ArbitrageOpportunityList } from './arbitrage/ArbitrageOpportunityList';
import { ArbitrageSimulationResults } from './arbitrage/ArbitrageSimulationResults';
import { ArbitragePerformanceStats } from './arbitrage/ArbitragePerformanceStats';

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
    totalPotentialProfit,
    isAutoScanning
  } = useRealTimeArbitrage();

  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const topOpportunities = getTopOpportunities(8);

  // Convert opportunities to the expected format for the component
  const convertedOpportunities = topOpportunities.map(opp => ({
    id: opp.id,
    pair: opp.pair || 'ADA/USDC',
    buyDex: opp.buyDex || 'Unknown',
    sellDex: opp.sellDex || 'Unknown',
    buyPrice: opp.buyPrice || 0,
    sellPrice: opp.sellPrice || 0,
    profitPercentage: opp.profitPercentage,
    profitADA: opp.profitADA || 0,
    volumeAvailable: opp.volumeAvailable || 0,
    confidence: opp.confidence as 'HIGH' | 'MEDIUM' | 'LOW',
    timeToExpiry: opp.timeToExpiry || 300,
    slippageRisk: opp.slippageRisk || 0
  }));

  const handleAutoScanToggle = () => {
    if (isAutoScanning) {
      stopAutoScan();
    } else {
      startAutoScan(scanInterval);
    }
  };

  const handleSimulate = async (opportunityId: string) => {
    setSelectedOpportunity(opportunityId);
    const result = await simulateExecution(opportunityId);
    setSimulationResult(result);
  };

  return (
    <div className="space-y-6">
      <ArbitrageControlPanel
        isScanning={isScanning}
        isAutoScanning={isAutoScanning}
        totalOpportunities={totalOpportunities}
        highConfidenceOpportunities={highConfidenceOpportunities}
        avgProfitPercentage={avgProfitPercentage}
        totalPotentialProfit={totalPotentialProfit}
        lastScan={lastScan}
        scanInterval={scanInterval}
        successRate={stats.successRate}
        onAutoScanToggle={handleAutoScanToggle}
        onManualScan={performScan}
      />

      <ArbitrageOpportunityList
        opportunities={convertedOpportunities}
        isScanning={isScanning}
        onSimulate={handleSimulate}
      />

      <ArbitrageSimulationResults
        simulationResult={simulationResult}
        selectedOpportunity={selectedOpportunity}
      />

      <ArbitragePerformanceStats
        stats={stats}
      />
    </div>
  );
};
