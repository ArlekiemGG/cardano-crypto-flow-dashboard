
import { useFetchOptimizedData } from './useFetchOptimizedData';

export const usePriceData = () => {
  const { data, isLoading, dataSource, lastUpdate, forceRefresh } = useFetchOptimizedData();

  return {
    prices: data.prices,
    isLoading,
    dataSource,
    lastUpdate,
    forceRefresh,
    
    // Specific price getters
    getADAPrice: () => {
      const adaData = data.prices?.coins?.['coingecko:cardano'];
      return adaData?.price || 0;
    },
    
    // Get price by token ID
    getTokenPrice: (tokenId: string) => {
      const tokenData = data.prices?.coins?.[tokenId];
      return tokenData?.price || 0;
    }
  };
};
