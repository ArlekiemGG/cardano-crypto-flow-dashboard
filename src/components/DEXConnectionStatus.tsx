
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, WifiOff } from 'lucide-react';
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';

export const DEXConnectionStatus = () => {
  const { 
    dexVolumes, 
    isLoading, 
    lastUpdate, 
    getTopDEXsByVolume,
    getTotalDexVolume24h
  } = useOptimizedMarketData();
  
  // Get DEX data from DeFiLlama
  const topDEXs = getTopDEXsByVolume(10);
  const totalVolume = getTotalDexVolume24h();
  
  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `₳ ${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `₳ ${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `₳ ${(volume / 1000).toFixed(1)}K`;
    } else {
      return `₳ ${volume.toFixed(0)}`;
    }
  };
  
  // Cardano DEXs we want to display
  const cardanoDEXs = [
    'Minswap', 
    'SundaeSwap', 
    'MuesliSwap', 
    'WingRiders', 
    'VyFinance'
  ];

  // Map DEX data from DeFiLlama to our UI format
  const dexConnectionStatus = cardanoDEXs.map(dexName => {
    // Find the DEX in our DeFiLlama data
    const dexData = topDEXs.find(dex => 
      dex.name.toLowerCase().includes(dexName.toLowerCase())
    );
    
    // Check if we have data for this DEX
    const hasData = dexData && dexData.total24h > 0;
    const volume = dexData ? dexData.total24h : 0;
    
    return {
      name: dexName,
      status: hasData,
      volume: hasData ? formatVolume(volume) : 'No data'
    };
  });

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-crypto-primary" />
          <span>DEX Connection Status</span>
          {isLoading && <span className="text-xs text-gray-400">(Loading...)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dexConnectionStatus.map((dex) => (
            <div key={dex.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-3">
                {dex.status ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-white font-medium">{dex.name}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">{dex.volume}</span>
                <div className={`w-2 h-2 rounded-full ${dex.status ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Last Update:</span>
              <span className="text-white">{lastUpdate?.toLocaleTimeString() || 'Updating...'}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">Total DEX Volume:</span>
              <span className="text-crypto-primary font-mono">
                {totalVolume > 0 ? formatVolume(totalVolume) : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
