
import { useFetchOptimizedData } from './optimized-data/useFetchOptimizedData';
import { usePriceData } from './optimized-data/usePriceData';
import { useProtocolData } from './optimized-data/useProtocolData';
import { useDEXVolumeData } from './optimized-data/useDEXVolumeData';

export const useOptimizedMarketData = () => {
  const { data, forceRefresh, isLoading, lastUpdate, dataSource, cacheStats } = useFetchOptimizedData();
  const priceData = usePriceData();
  const protocolData = useProtocolData();
  const dexVolumeData = useDEXVolumeData();

  return {
    // Raw data from APIs
    prices: data.prices,
    protocols: data.protocols,
    dexVolumes: data.dexVolumes,
    
    // Base info
    isLoading,
    lastUpdate,
    dataSource,
    cacheStats,
    forceRefresh,
    
    // Enhanced price methods with real data validation
    getADAPrice: priceData.getADAPrice,
    getADAChange24h: priceData.getADAChange24h,
    getADAVolume24h: priceData.getADAVolume24h,
    getTokenPrice: priceData.getTokenPrice,
    hasRealPriceData: priceData.hasRealPriceData,
    
    // Protocol methods
    getTopProtocolsByTVL: protocolData.getTopProtocolsByTVL,
    getTotalCardanoTVL: protocolData.getTotalCardanoTVL,
    getProtocolByName: protocolData.getProtocolByName,
    getProtocolById: protocolData.getProtocolById,
    
    // DEX volume methods
    getDexVolumeByName: dexVolumeData.getDexVolumeByName,
    getTotalDexVolume24h: dexVolumeData.getTotalDexVolume24h,
    getTopDEXsByVolume: dexVolumeData.getTopDEXsByVolume,
    getDEXCount: dexVolumeData.getDEXCount,
    
    // Real data validation helpers
    isRealDataAvailable: () => {
      return dataSource !== 'native' && 
             priceData.hasRealPriceData() && 
             dexVolumeData.getDEXCount() > 0;
    },
    
    getDataQuality: () => {
      if (dataSource === 'defillama') return 'excellent';
      if (dataSource === 'mixed') return 'good';
      return 'poor';
    }
  };
};
