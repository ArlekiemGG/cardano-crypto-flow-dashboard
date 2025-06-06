
import { useState, useEffect } from 'react';
import { useMarketData } from './useMarketData';
import { MarketData } from '@/types/trading';

export const useRealTimeData = () => {
  const { marketData, isLoading, isConnected, lastUpdate } = useMarketData();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (isLoading) {
      setConnectionStatus('connecting');
    } else if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isLoading, isConnected]);

  // Filter to only return ADA data with real CoinGecko price
  const processedMarketData = marketData.map(data => {
    // For ADA specifically, ensure we're using the real CoinGecko price
    if (data.symbol === 'ADA') {
      // Find CoinGecko data specifically
      const coinGeckoData = marketData.find(item => 
        item.symbol === 'ADA' && item.lastUpdate && 
        item.lastUpdate.includes('CoinGecko')
      );
      
      if (coinGeckoData) {
        return coinGeckoData;
      }
    }
    return data;
  });

  return {
    marketData: processedMarketData,
    isConnected: connectionStatus === 'connected',
    isLoading: connectionStatus === 'connecting',
    lastUpdate,
    connectionStatus
  };
};
