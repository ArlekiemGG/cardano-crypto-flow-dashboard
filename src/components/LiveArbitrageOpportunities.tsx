
import { useMarketData } from '@/hooks/useMarketData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, DollarSign, Activity } from 'lucide-react';

export const LiveArbitrageOpportunities = () => {
  const { arbitrageOpportunities, isLoading, isConnected } = useMarketData();

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-crypto-primary" />
            <span>Live Arbitrage Opportunities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">Loading opportunities...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-crypto-primary" />
            <span>Live Arbitrage Opportunities</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs text-gray-400">{arbitrageOpportunities.length} active</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {arbitrageOpportunities.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No arbitrage opportunities detected
            </div>
          ) : (
            arbitrageOpportunities.slice(0, 5).map((opportunity) => (
              <div key={opportunity.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{opportunity.pair}</span>
                    <span className="text-xs text-gray-400">
                      {opportunity.dexA} → {opportunity.dexB}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      +{opportunity.profitPercentage.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      ₳ {(opportunity.priceA - opportunity.priceB).toFixed(4)} spread
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`${
                      opportunity.confidence === 'High' 
                        ? 'border-green-500 text-green-400' 
                        : opportunity.confidence === 'Medium'
                        ? 'border-yellow-500 text-yellow-400'
                        : 'border-red-500 text-red-400'
                    }`}
                  >
                    {opportunity.confidence}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
