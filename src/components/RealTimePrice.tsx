
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const RealTimePrice = () => {
  const { marketData, isConnected, lastUpdate } = useRealTimeData();
  const adaData = marketData.find(data => data.symbol === 'ADA');

  if (!adaData) return null;

  const isPositive = adaData.change24h >= 0;

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
      <span className="text-gray-400">ADA/USD:</span>
      <span className="text-white font-mono font-bold">${adaData.price.toFixed(4)}</span>
      <div className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="text-xs ml-1">{isPositive ? '+' : ''}{adaData.change24h.toFixed(2)}%</span>
      </div>
      <span className="text-xs text-gray-500">
        {lastUpdate.toLocaleTimeString()}
      </span>
    </div>
  );
};
