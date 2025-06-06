
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield } from 'lucide-react';

interface ArbitrageStats {
  totalOpportunities: number;
  avgProfitPercentage: number;
  successRate: number;
  totalVolume: number;
}

interface ArbitragePerformanceStatsProps {
  stats: ArbitrageStats;
}

export const ArbitragePerformanceStats = ({
  stats
}: ArbitragePerformanceStatsProps) => {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-purple-400" />
          <span>7-Day Performance Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-lg font-bold text-white">{stats.totalOpportunities}</div>
            <div className="text-sm text-gray-400">Total Opportunities</div>
            <Progress value={Math.min(100, stats.totalOpportunities)} className="mt-2" />
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">{stats.avgProfitPercentage.toFixed(2)}%</div>
            <div className="text-sm text-gray-400">Avg Profit</div>
            <Progress value={Math.min(100, stats.avgProfitPercentage * 10)} className="mt-2" />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">{stats.successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Success Rate</div>
            <Progress value={stats.successRate} className="mt-2" />
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400">₳ {stats.totalVolume.toFixed(0)}</div>
            <div className="text-sm text-gray-400">Total Volume</div>
            <Progress value={Math.min(100, stats.totalVolume / 10000)} className="mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
