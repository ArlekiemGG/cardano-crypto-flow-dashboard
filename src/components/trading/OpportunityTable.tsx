
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface Opportunity {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitPercentage: number;
  profitADA: number;
  volumeAvailable: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  executionReady: boolean;
}

interface OpportunityTableProps {
  opportunities: Opportunity[];
  onExecute: (id: string) => void;
  executingTrades: Set<string>;
}

const getConfidenceBadgeColor = (confidence: string) => {
  switch (confidence) {
    case 'HIGH': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'LOW': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const OpportunityTable = ({ 
  opportunities, 
  onExecute, 
  executingTrades 
}: OpportunityTableProps) => {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-400 mb-2">No opportunities found</div>
        <div className="text-sm text-gray-500">Markets are currently efficient or scanning in progress...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Pair</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Buy DEX</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Sell DEX</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Profit</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Volume</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Confidence</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => (
            <tr key={opp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 px-4">
                <span className="text-white font-medium">{opp.pair}</span>
              </td>
              <td className="py-4 px-4">
                <div>
                  <div className="text-white">{opp.buyDex}</div>
                  <div className="text-gray-400 text-sm font-mono">
                    {typeof opp.buyPrice === 'number' ? `$${opp.buyPrice.toFixed(4)}` : opp.buyPrice}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div>
                  <div className="text-white">{opp.sellDex}</div>
                  <div className="text-gray-400 text-sm font-mono">
                    {typeof opp.sellPrice === 'number' ? `$${opp.sellPrice.toFixed(4)}` : opp.sellPrice}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-green-400 font-bold">{opp.profitPercentage.toFixed(2)}%</div>
                <div className="text-xs text-gray-400">₳ {opp.profitADA.toFixed(2)}</div>
              </td>
              <td className="py-4 px-4">
                <span className="text-white font-mono">₳ {opp.volumeAvailable.toFixed(0)}</span>
              </td>
              <td className="py-4 px-4">
                <Badge className={`px-2 py-1 text-xs border ${getConfidenceBadgeColor(opp.confidence)}`}>
                  {opp.confidence}
                </Badge>
                {opp.executionReady && (
                  <div className="text-xs text-green-400 mt-1">✓ Ready</div>
                )}
              </td>
              <td className="py-4 px-4">
                <Button 
                  size="sm" 
                  onClick={() => onExecute(opp.id)}
                  disabled={executingTrades.has(opp.id)}
                  className="bg-crypto-primary hover:bg-crypto-secondary transition-colors disabled:opacity-50"
                >
                  {executingTrades.has(opp.id) ? 'Executing...' : 'Execute'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
