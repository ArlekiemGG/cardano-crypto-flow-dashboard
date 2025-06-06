
import { useState, useEffect, useRef } from 'react';
import { optimizedDataService } from '@/services/optimizedDataService';

interface OptimizedMarketData {
  prices: Record<string, any>;
  protocols: any[];
  dexVolumes: any;
  isLoading: boolean;
  lastUpdate: Date;
  dataSource: 'defillama' | 'native' | 'mixed';
  cacheStats: any;
}

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
const CRITICAL_TOKENS = ['coingecko:cardano'];

export const useOptimizedMarketData = () => {
  const [data, setData] = useState<OptimizedMarketData>({
    prices: {},
    protocols: [],
    dexVolumes: null,
    isLoading: true,
    lastUpdate: new Date(),
    dataSource: 'defillama',
    cacheStats: {}
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchAllData = async () => {
    try {
      console.log('🚀 Fetching optimized market data...');
      setData(prev => ({ ...prev, isLoading: true }));

      // Fetch en paralelo para mejor performance
      const [pricesResult, protocolsResult, volumesResult] = await Promise.allSettled([
        optimizedDataService.getCurrentPrices(CRITICAL_TOKENS),
        optimizedDataService.getCardanoProtocols(),
        optimizedDataService.getCardanoDexVolumes()
      ]);

      // Procesar resultados
      const newData: Partial<OptimizedMarketData> = {
        lastUpdate: new Date(),
        isLoading: false,
        cacheStats: optimizedDataService.getCacheStats()
      };

      if (pricesResult.status === 'fulfilled') {
        newData.prices = pricesResult.value;
      } else {
        console.error('❌ Error fetching prices:', pricesResult.reason);
        newData.prices = {};
      }

      if (protocolsResult.status === 'fulfilled') {
        newData.protocols = protocolsResult.value;
      } else {
        console.error('❌ Error fetching protocols:', protocolsResult.reason);
        newData.protocols = [];
      }

      if (volumesResult.status === 'fulfilled') {
        newData.dexVolumes = volumesResult.value;
      } else {
        console.error('❌ Error fetching DEX volumes:', volumesResult.reason);
        newData.dexVolumes = null;
      }

      // Determinar fuente de datos predominante
      const cacheStats = optimizedDataService.getCacheStats();
      const totalSources = Object.values(cacheStats.sources || {}).reduce((a: number, b: number) => a + b, 0);
      const defiLlamaCount = cacheStats.sources?.defillama || 0;
      
      newData.dataSource = defiLlamaCount / totalSources > 0.7 ? 'defillama' : 
                          defiLlamaCount === 0 ? 'native' : 'mixed';

      setData(prev => ({ ...prev, ...newData }));
      
      console.log(`✅ Optimized data updated - Source: ${newData.dataSource}, Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Error in optimized data fetch:', error);
      setData(prev => ({ 
        ...prev, 
        isLoading: false,
        dataSource: 'native' 
      }));
    }
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing optimized data...');
    await optimizedDataService.refreshCriticalData();
    await fetchAllData();
  };

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing optimized market data service...');
    
    // Fetch inicial
    fetchAllData();

    // Configurar actualizaciones periódicas
    intervalRef.current = setInterval(fetchAllData, UPDATE_INTERVAL);

    return () => {
      console.log('🧹 Cleaning up optimized market data service...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

  return {
    ...data,
    forceRefresh,
    
    // Métodos de acceso específicos
    getADAPrice: () => {
      const adaData = data.prices?.coins?.['coingecko:cardano'];
      return adaData?.price || 0;
    },
    
    getTopProtocolsByTVL: (limit = 10) => {
      return data.protocols
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, limit);
    },
    
    getTotalCardanoTVL: () => {
      return data.protocols.reduce((sum, protocol) => sum + (protocol.tvl || 0), 0);
    },
    
    getDexVolumeByName: (dexName: string) => {
      return data.dexVolumes?.protocols?.find((dex: any) => 
        dex.name?.toLowerCase().includes(dexName.toLowerCase())
      );
    }
  };
};
