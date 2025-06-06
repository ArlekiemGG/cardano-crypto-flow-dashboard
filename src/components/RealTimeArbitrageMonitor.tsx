
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
        opportunities={topOpportunities}
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
