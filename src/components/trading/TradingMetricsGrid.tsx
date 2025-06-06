
import { TrendingUp, CheckCircle, Zap, Clock } from 'lucide-react';

interface TradingMetricsGridProps {
  stats: {
    totalOpportunities: number;
    avgProfitPercentage: number;
    totalPotentialProfit: number;
    highConfidenceCount: number;
    lastScanTime: Date;
  };
  isScanning: boolean;
}

export const TradingMetricsGrid = ({ stats, isScanning }: TradingMetricsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total Opportunities</span>
          <TrendingUp className="h-4 w-4 text-crypto-primary" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.totalOpportunities}</div>
        <div className="text-sm text-gray-500">
          {stats.highConfidenceCount} high confidence
        </div>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Avg Profit</span>
          <CheckCircle className="h-4 w-4 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-green-400">
          {stats.avgProfitPercentage.toFixed(2)}%
        </div>
        <div className="text-sm text-gray-500">Per opportunity</div>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Potential Profit</span>
          <Zap className="h-4 w-4 text-crypto-profit" />
        </div>
        <div className="text-2xl font-bold text-crypto-profit">
          ₳ {stats.totalPotentialProfit.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">Total available</div>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Last Scan</span>
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-sm font-mono text-white">
          {stats.lastScanTime.toLocaleTimeString()}
        </div>
        <div className="text-sm text-gray-500">
          {isScanning ? 'Scanning...' : 'Idle'}
        </div>
      </div>
    </div>
  );
};
