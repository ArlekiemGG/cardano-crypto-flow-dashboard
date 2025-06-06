
import { useMarketData } from '@/hooks/useMarketData';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

export const RealTimePrice = () => {
  const { marketData, isConnected, isLoading } = useMarketData();
  
  // Get the real ADA price from market data
  const adaData = marketData.find(data => data.symbol === 'ADA');
  const adaPrice = adaData?.price || 0;
  const change24h = adaData?.change24h || 0;
  const volume24h = adaData?.volume24h || 0;
  const isPositive = change24h >= 0;
  
  // Validate that we have real data (not mock data)
  const isRealPrice = adaPrice > 0.1 && adaPrice < 10 && adaPrice !== 1;
  const hasValidData = isRealPrice && isConnected;

  // Format volume for display
  const formatVolume = (vol: number) => {
    if (vol >= 1000000000) return `$${(vol / 1000000000).toFixed(1)}B`;
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${hasValidData ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
      
      <span className="text-gray-400">ADA:</span>
      
      {hasValidData ? (
        <>
          <span className="text-white font-mono font-bold">
            ${adaPrice.toFixed(4)}
          </span>
          
          {change24h !== 0 && (
            <div className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="text-xs ml-1">
                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
              </span>
            </div>
          )}

          {volume24h > 0 && (
            <span className="text-xs text-gray-500">
              Vol: {formatVolume(volume24h)}
            </span>
          )}
          
          <span className="text-xs text-gray-500">
            {adaData?.lastUpdate ? new Date(adaData.lastUpdate).toLocaleTimeString() : 'Live'}
          </span>

          {adaData?.source && (
            <span className="text-xs text-green-400">
              {adaData.source}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="text-gray-500 font-mono">
            {isLoading ? 'Cargando...' : 'Sin datos'}
          </span>
          <WifiOff className="h-3 w-3 text-red-400" />
        </>
      )}
    </div>
  );
};
