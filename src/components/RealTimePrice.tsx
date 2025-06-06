
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';
import { useMarketData } from '@/hooks/useMarketData';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

export const RealTimePrice = () => {
  const { marketData, isConnected } = useMarketData();
  
  // Get the most recent ADA price from market data
  const adaData = marketData.find(data => data.symbol === 'ADA');
  const adaPrice = adaData?.price || 0;
  const change24h = adaData?.change24h || 0;
  const isPositive = change24h >= 0;
  const isValidPrice = adaPrice > 0 && adaPrice < 10; // Reasonable range for ADA

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isConnected && isValidPrice ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
      
      <span className="text-gray-400">ADA/USD:</span>
      
      {isValidPrice ? (
        <>
          <span className="text-white font-mono font-bold">${adaPrice.toFixed(4)}</span>
          
          <div className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="text-xs ml-1">{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
          </div>
          
          <span className="text-xs text-gray-500">
            {adaData?.lastUpdate ? new Date(adaData.lastUpdate).toLocaleTimeString() : 'Updating...'}
          </span>
        </>
      ) : (
        <>
          <span className="text-gray-500 font-mono">Cargando...</span>
          <WifiOff className="h-3 w-3 text-red-400" />
        </>
      )}
    </div>
  );
};
