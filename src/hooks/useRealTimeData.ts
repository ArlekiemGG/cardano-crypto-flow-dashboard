
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

  // Return real market data directly without any artificial modifications
  return {
    marketData: marketData,
    isConnected: connectionStatus === 'connected',
    isLoading: connectionStatus === 'connecting',
    lastUpdate,
    connectionStatus
  };
};
