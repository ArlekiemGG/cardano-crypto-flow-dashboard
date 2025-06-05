
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

  // Simulate real-time price updates with small variations
  const [realtimeMarketData, setRealtimeMarketData] = useState<MarketData[]>([]);

  useEffect(() => {
    if (marketData.length > 0) {
      setRealtimeMarketData(marketData);
      
      // Update prices with small random variations every 5 seconds
      const interval = setInterval(() => {
        setRealtimeMarketData(prev => 
          prev.map(data => ({
            ...data,
            price: data.price * (0.999 + Math.random() * 0.002), // ±0.1% variation
            change24h: data.change24h + (Math.random() - 0.5) * 0.1, // Small change variation
            lastUpdate: new Date().toISOString()
          }))
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [marketData]);

  return {
    marketData: realtimeMarketData,
    isConnected: connectionStatus === 'connected',
    isLoading: connectionStatus === 'connecting',
    lastUpdate,
    connectionStatus
  };
};
