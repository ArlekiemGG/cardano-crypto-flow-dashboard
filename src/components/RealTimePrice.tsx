
import { useUnifiedMarketData } from '@/hooks/useUnifiedMarketData';
import { TrendingUp, TrendingDown, WifiOff } from 'lucide-react';

export const RealTimePrice = () => {
  const { getADAPrice, getADAChange24h, isLoading, dataSource, lastUpdate } = useUnifiedMarketData();
  
  const adaPrice = getADAPrice();
  const change24h = getADAChange24h();
  const isPositive = change24h >= 0;
  
  const hasRealData = adaPrice > 0.1 && adaPrice < 10 && !isLoading && dataSource !== 'native';
  
  const dataAge = new Date().getTime() - lastUpdate.getTime();
  const isDataFresh = dataAge < 600000; // 10 minutes

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
