
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Clock,
  Calculator
} from 'lucide-react';

interface RealArbitrageOpportunity {
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
  timeToExpiry: number;
  slippageRisk: number;
}

interface ArbitrageOpportunityListProps {
  opportunities: RealArbitrageOpportunity[];
  isScanning: boolean;
  onSimulate: (opportunityId: string) => void;
}

export const ArbitrageOpportunityList = ({
  opportunities,
  isScanning,
  onSimulate
}: ArbitrageOpportunityListProps) => {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return 'border-green-500 text-green-400 bg-green-500/10';
      case 'MEDIUM': return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
      case 'LOW': return 'border-red-500 text-red-400 bg-red-500/10';
      default: return 'border-gray-500 text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <span>Top Arbitrage Opportunities</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {opportunities.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {isScanning ? 'Scanning for opportunities...' : 'No arbitrage opportunities found'}
            </div>
          ) : (
            opportunities.map((opportunity) => (
              <div 
                key={opportunity.id} 
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium text-white">{opportunity.pair}</div>
                    <div className="text-sm text-gray-400">
                      {opportunity.buyDex} → {opportunity.sellDex}
                    </div>
                    <div className="text-xs text-gray-500">
                      Volume: ₳ {opportunity.volumeAvailable.toFixed(0)} | 
                      Slippage: {opportunity.slippageRisk.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      +{opportunity.profitPercentage.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-400">
                      ₳ {opportunity.profitADA.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {opportunity.buyPrice.toFixed(4)} → {opportunity.sellPrice.toFixed(4)}
                    </div>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={getConfidenceColor(opportunity.confidence)}
                  >
                    {opportunity.confidence}
                  </Badge>

                  <div className="flex flex-col space-y-1">
                    <Button
                      onClick={() => onSimulate(opportunity.id)}
                      size="sm"
                      variant="outline"
                      className="border-crypto-primary/50 text-crypto-primary hover:bg-crypto-primary/10"
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      Simulate
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {Math.floor(opportunity.timeToExpiry / 60)}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
