
import { useState, useEffect } from 'react';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { optimizedDataService } from '@/services/optimizedDataService';
import { CacheStats } from '@/services/optimized-data/types';

export const useConnectionHealth = () => {
  const [connectionHealth, setConnectionHealth] = useState({
    blockfrost: false,
    defiLlama: false
  });

  useEffect(() => {
    const updateHealth = async () => {
      // Verificar la conexión de Blockfrost usando realTimeMarketDataService
      const blockfrostHealth = realTimeMarketDataService.isConnected();
      
      // Verificar la conexión de DeFiLlama usando optimizedDataService
      // Podemos verificar mediante las estadísticas de cache para ver si hay datos
      const cacheStats: CacheStats = optimizedDataService.getCacheStats?.() || { 
        sources: {},
        total: 0,
        valid: 0,
        expired: 0,
        hitRate: 0
      };
      
      const defiLlamaConnected = 
        (cacheStats.sources && 'defillama' in cacheStats.sources && cacheStats.sources.defillama > 0) ||
        false;
      
      setConnectionHealth({
        blockfrost: blockfrostHealth,
        defiLlama: defiLlamaConnected
      });
    };

    // Actualizar inmediatamente al montar el componente
    updateHealth();
    
    // Establecer intervalo para actualizar periódicamente
    const interval = setInterval(updateHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calcular el número de fuentes conectadas
  const connectedSources = Object.values(connectionHealth).filter(Boolean).length;
  
  return { 
    connectionHealth, 
    connectedSources,
    isFullyConnected: connectedSources === 2,
    isPartiallyConnected: connectedSources > 0 && connectedSources < 2,
    isDisconnected: connectedSources === 0
  };
};
