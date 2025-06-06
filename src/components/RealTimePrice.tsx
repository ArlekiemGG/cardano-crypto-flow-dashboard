
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

export const RealTimePrice = () => {
  const { getADAPrice, prices, isLoading, dataSource, lastUpdate } = useOptimizedMarketData();
  
  // Get real ADA price directly from DeFiLlama/CoinGecko
  const adaPrice = getADAPrice();
  
  // Get real 24h change directly from price data
  const getRealChange24h = () => {
    const adaData = prices?.coins?.['coingecko:cardano'];
    if (adaData?.change_24h && typeof adaData.change_24h === 'number') {
      return adaData.change_24h;
    }
    return 0;
  };
  
  // Get real volume directly from price data
  const getRealVolume24h = () => {
    const adaData = prices?.coins?.['coingecko:cardano'];
    if (adaData?.volume_24h && typeof adaData.volume_24h === 'number') {
      return adaData.volume_24h;
    }
    return 0;
  };
  
  const change24h = getRealChange24h();
  const volume24h = getRealVolume24h();
  const isPositive = change24h >= 0;
  
  // Validate that we have real data from external APIs
  const hasRealData = adaPrice > 0.1 && adaPrice < 10 && !isLoading && dataSource !== 'native';
  
  // Data freshness check (within 10 minutes)
  const dataAge = new Date().getTime() - lastUpdate.getTime();
  const isDataFresh = dataAge < 600000; // 10 minutes

  // Format volume for display
  const formatVolume = (vol: number) => {
    if (vol >= 1000000000) return `$${(vol / 1000000000).toFixed(1)}B`;
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        hasRealData && isDataFresh ? 'bg-green-400 animate-pulse' : 'bg-red-400'
      }`}></div>
      
      <span className="text-gray-400">ADA:</span>
      
      {hasRealData ? (
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
          
          <span className="text-xs text-green-400">
            {dataSource === 'defillama' ? 'Real' : dataSource === 'mixed' ? 'Mixto' : 'Cache'}
          </span>
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
