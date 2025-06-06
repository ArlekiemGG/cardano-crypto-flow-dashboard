
import { useState, useEffect } from 'react';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';

export const useConnectionHealth = () => {
  const [connectionHealth, setConnectionHealth] = useState({
    blockfrost: false,
    defiLlama: false
  });

  useEffect(() => {
    const updateHealth = () => {
      const health = realTimeMarketDataService.getConnectionHealth();
      setConnectionHealth(health);
    };

    updateHealth();
    const interval = setInterval(updateHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const connectedSources = Object.values(connectionHealth).filter(Boolean).length;

  return { connectionHealth, connectedSources };
};
