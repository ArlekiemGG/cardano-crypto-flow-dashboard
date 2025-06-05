
import { useMarketData } from '@/hooks/useMarketData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, Activity, CheckCircle } from 'lucide-react';

export const DEXConnectionStatus = () => {
  const { isConnected, lastUpdate } = useMarketData();

  const dexes = [
    { name: 'Minswap', status: isConnected, volume: '₳ 2.4M' },
    { name: 'SundaeSwap', status: isConnected, volume: '₳ 1.8M' },
    { name: 'MuesliSwap', status: isConnected, volume: '₳ 1.2M' },
    { name: 'WingRiders', status: isConnected, volume: '₳ 856K' },
    { name: 'VyFinance', status: isConnected, volume: '₳ 642K' }
  ];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-crypto-primary" />
          <span>DEX Connection Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dexes.map((dex) => (
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
