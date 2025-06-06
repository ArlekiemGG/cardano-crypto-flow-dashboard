
import { useMarketData } from '@/hooks/useMarketData';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, Activity, CheckCircle } from 'lucide-react';
import { dexService } from '@/services/dexService';

export const DEXConnectionStatus = () => {
  const { isConnected, lastUpdate } = useMarketData();

  // Fetch real DEX volumes
  const { data: dexVolumes = [], isLoading: volumesLoading } = useQuery({
    queryKey: ['dex-volumes'],
    queryFn: () => dexService.getRealVolumes(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000
  });

  // Get all cached DEX data for connection status
  const { data: allDexData = [], isLoading: dataLoading } = useQuery({
    queryKey: ['all-dex-prices'],
    queryFn: () => dexService.getAllDEXPrices(),
    refetchInterval: 30000,
    staleTime: 15000
  });

  // Calculate volumes by DEX from cached data
  const volumesByDex = dexVolumes.reduce((acc, { dex, totalVolume }) => {
    acc[dex] = totalVolume;
    return acc;
  }, {} as Record<string, number>);

  // Check which DEXs have recent data
  const dexConnectionStatus = ['Minswap', 'SundaeSwap', 'MuesliSwap', 'WingRiders', 'VyFinance'].map(dexName => {
    const hasRecentData = allDexData.some(data => 
      data.dex === dexName && 
      new Date(data.lastUpdate).getTime() > Date.now() - 300000 // 5 minutes
    );
    
    const volume = volumesByDex[dexName] || 0;
    
    return {
      name: dexName,
      status: hasRecentData,
      volume: volume > 0 ? (
        volume > 1000000 
          ? `₳ ${(volume / 1000000).toFixed(1)}M`
          : volume > 1000
          ? `₳ ${(volume / 1000).toFixed(0)}K`
          : `₳ ${volume.toFixed(0)}`
      ) : 'No data'
    };
  });

  const isLoading = volumesLoading || dataLoading;

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
              <span className="text-white">{lastUpdate.toLocaleTimeString()}</span>
            </div>
            {dexVolumes.length > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">Total DEX Volume:</span>
                <span className="text-crypto-primary font-mono">
                  ₳ {(dexVolumes.reduce((sum, { totalVolume }) => sum + totalVolume, 0) / 1000000).toFixed(1)}M
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
