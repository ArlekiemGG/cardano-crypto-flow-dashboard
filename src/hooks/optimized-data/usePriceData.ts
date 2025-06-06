
import { useFetchOptimizedData } from './useFetchOptimizedData';

export const usePriceData = () => {
  const { data, isLoading, dataSource, lastUpdate, forceRefresh } = useFetchOptimizedData();

  return {
    prices: data.prices,
    isLoading,
    dataSource,
    lastUpdate,
    forceRefresh,
    
    // Specific price getters with real data validation
    getADAPrice: () => {
      // Get real ADA price directly from DeFiLlama/CoinGecko data
      const adaData = data.prices?.coins?.['coingecko:cardano'];
      if (adaData?.price && typeof adaData.price === 'number' && adaData.price > 0.1 && adaData.price < 10) {
        return adaData.price;
      }
      
      // Only fallback if no real price data is available
      if (!adaData && data.protocols && data.protocols.length > 0) {
        console.warn('⚠️ Using fallback ADA price calculation - real price data not available');
        const firstProtocol = data.protocols[0];
        if (firstProtocol.tvl > 1000000) {
          return Math.min(Math.max(0.3, firstProtocol.tvl / 50000000), 2.0);
        }
      }
      
      return 0;
    },
    
    // Get real 24h change directly from price data
    getADAChange24h: () => {
      const adaData = data.prices?.coins?.['coingecko:cardano'];
      if (adaData?.change_24h && typeof adaData.change_24h === 'number') {
        return adaData.change_24h;
      }
      return 0;
    },
    
    // Get real volume directly from price data
    getADAVolume24h: () => {
      const adaData = data.prices?.coins?.['coingecko:cardano'];
      if (adaData?.volume_24h && typeof adaData.volume_24h === 'number') {
        return adaData.volume_24h;
      }
      return 0;
    },
    
    // Get price by token ID with real validation
    getTokenPrice: (tokenId: string) => {
      const tokenData = data.prices?.coins?.[tokenId];
      if (tokenData?.price && typeof tokenData.price === 'number') {
        return tokenData.price;
      }
      return 0;
    },
    
    // Check if we have real price data (not derived/calculated)
    hasRealPriceData: () => {
      const adaData = data.prices?.coins?.['coingecko:cardano'];
      return !!(adaData?.price && dataSource !== 'native');
    }
  };
};
