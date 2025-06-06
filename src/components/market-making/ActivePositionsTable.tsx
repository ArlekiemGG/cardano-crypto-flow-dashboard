import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { MarketMakingPosition } from "@/hooks/useMarketMakingPositions";

interface ActivePositionsTableProps {
  positions: MarketMakingPosition[];
  onTogglePosition: (id: string) => void;
  onRemoveLiquidity: (id: string) => void;
  isLoading: boolean;
}

export const ActivePositionsTable = ({ 
  positions, 
  onTogglePosition, 
  onRemoveLiquidity,
  isLoading 
}: ActivePositionsTableProps) => {
  if (positions.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-4">No active positions</div>
          <p className="text-sm text-gray-500">
            Start providing liquidity to earn trading fees
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-white">Active Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => (
            <div 
              key={position.id} 
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="text-white font-medium">{position.pair}</h3>
                    <p className="text-sm text-gray-400">{position.dex}</p>
                  </div>
                  <Badge 
                    variant={position.status === 'active' ? 'default' : 'secondary'}
                    className={position.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
                  >
                    {position.status}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTogglePosition(position.id)}
                    disabled={isLoading}
                    className="border-white/20 hover:bg-white/10"
                  >
                    {position.status === 'active' ? 
                      <Pause className="h-4 w-4" /> : 
                      <Play className="h-4 w-4" />
                    }
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveLiquidity(position.id)}
                    disabled={isLoading}
                    className="border-red-500/50 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Liquidity</p>
                  <p className="text-white font-mono">₳ {position.liquidityProvided.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 mb-1">Current Spread</p>
                  <p className="text-white font-mono">{position.currentSpread.toFixed(3)}%</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 mb-1">24h Volume</p>
                  <p className="text-white font-mono">₳ {position.volume24h.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 mb-1">APY</p>
                  <div className="flex items-center space-x-1">
                    {position.apy >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                    <p className={`font-mono ${position.apy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.apy.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Fees Earned</p>
                  <p className="text-green-400 font-mono">₳ {position.feesEarned.toFixed(2)}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 mb-1">Impermanent Loss</p>
                  <p className={`font-mono ${position.impermanentLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₳ {position.impermanentLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
