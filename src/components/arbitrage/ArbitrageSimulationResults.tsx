
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye,
  AlertTriangle
} from 'lucide-react';

interface SimulationResult {
  success: boolean;
  estimatedProfit?: number;
  estimatedSlippage?: number;
  timeEstimate?: number;
}

interface ArbitrageSimulationResultsProps {
  simulationResult: SimulationResult | null;
  selectedOpportunity: string | null;
}

export const ArbitrageSimulationResults = ({
  simulationResult,
  selectedOpportunity
}: ArbitrageSimulationResultsProps) => {
  if (!simulationResult || !selectedOpportunity) {
    return null;
  }

  return (
    <Card className="glass border-crypto-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-crypto-primary" />
          <span>Trade Simulation Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${simulationResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {simulationResult.success ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-400">Success</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-crypto-primary">
              ₳ {simulationResult.estimatedProfit?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-400">Est. Profit</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400">
              {simulationResult.estimatedSlippage?.toFixed(2) || '0.00'}%
            </div>
            <div className="text-sm text-gray-400">Est. Slippage</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">
              {simulationResult.timeEstimate || 0}s
            </div>
            <div className="text-sm text-gray-400">Est. Time</div>
          </div>
        </div>
        
        {!simulationResult.success && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Trade simulation failed. High slippage or insufficient liquidity detected.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
