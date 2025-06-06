
import { useState, useEffect } from 'react';
import { useMarketData } from './useMarketData';

interface ConnectionHealth {
  blockfrost: boolean;
  defiLlama: boolean;
}

export const useConnectionHealth = () => {
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>({
    blockfrost: false,
    defiLlama: false
  });
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  
  const { isConnected, lastUpdate } = useMarketData();

  useEffect(() => {
    // Simulate connection health checks
    const checkConnections = () => {
      // In a real implementation, these would be actual health checks
      setConnectionHealth({
        blockfrost: isConnected,
        defiLlama: isConnected
      });
      
      if (lastUpdate) {
        setLastDataUpdate(lastUpdate);
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, lastUpdate]);

  const connectedSources = Object.values(connectionHealth).filter(Boolean).length;
  const totalSources = Object.keys(connectionHealth).length;
  
  const isFullyConnected = connectedSources === totalSources;
  const isPartiallyConnected = connectedSources > 0 && connectedSources < totalSources;
  const isDisconnected = connectedSources === 0;

  const hasRecentData = (): boolean => {
    if (!lastDataUpdate) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastDataUpdate > fiveMinutesAgo;
  };

  const getDataAge = (): number => {
    if (!lastDataUpdate) return -1;
    return Date.now() - lastDataUpdate.getTime();
  };

  return {
    connectionHealth,
    connectedSources,
    totalSources,
    isFullyConnected,
    isPartiallyConnected,
    isDisconnected,
    hasRecentData,
    getDataAge,
    lastDataUpdate
  };
};
