
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
    // Raw data
    prices: data.prices,
    protocols: data.protocols,
    dexVolumes: data.dexVolumes,
    
    // Base info
    isLoading,
    lastUpdate,
    dataSource,
    cacheStats,
    forceRefresh,
    
    // Price methods
    getADAPrice: priceData.getADAPrice,
    getTokenPrice: priceData.getTokenPrice,
    
    // Protocol methods
    getTopProtocolsByTVL: protocolData.getTopProtocolsByTVL,
    getTotalCardanoTVL: protocolData.getTotalCardanoTVL,
    getProtocolByName: protocolData.getProtocolByName,
    getProtocolById: protocolData.getProtocolById,
    
    // DEX volume methods
    getDexVolumeByName: dexVolumeData.getDexVolumeByName,
    getTotalDexVolume24h: dexVolumeData.getTotalDexVolume24h,
    getTopDEXsByVolume: dexVolumeData.getTopDEXsByVolume,
    getDEXCount: dexVolumeData.getDEXCount
  };
};
