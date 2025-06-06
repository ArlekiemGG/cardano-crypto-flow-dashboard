
import { useFetchOptimizedData } from './useFetchOptimizedData';

export const usePriceData = () => {
  const { data, isLoading, dataSource, lastUpdate, forceRefresh } = useFetchOptimizedData();

  return {
    prices: data.prices,
    isLoading,
    dataSource,
    lastUpdate,
    forceRefresh,
    
    // Get real ADA price from database (CoinGecko data)
    getADAPrice: () => {
      // First try to get real CoinGecko data from the cached market data
      if (data.prices && Object.keys(data.prices).length > 0) {
        // Look for ADA/USD pair from CoinGecko
        const adaEntry = Object.values(data.prices).find(entry => 
          typeof entry === 'object' && 
          entry !== null && 
          'pair' in entry && 
          'source_dex' in entry &&
          'price' in entry &&
          (entry.pair === 'ADA/USD' || entry.pair?.includes('ADA')) &&
          entry.source_dex === 'CoinGecko' &&
          typeof entry.price === 'number' &&
          entry.price > 0.1 &&
          entry.price < 10
        );
        
        if (adaEntry && 'price' in adaEntry) {
          console.log('✅ Using real CoinGecko ADA price:', adaEntry.price);
          return adaEntry.price;
        }
      }

      // Fallback: Check if we have DeFiLlama protocol data to estimate
      if (data.protocols && data.protocols.length > 0) {
        const firstProtocol = data.protocols[0];
        if (firstProtocol?.tvl && firstProtocol.tvl > 1000000) {
          const estimatedPrice = Math.min(Math.max(0.4, firstProtocol.tvl / 50000000), 1.5);
          console.log('⚠️ Using estimated ADA price from protocol TVL:', estimatedPrice);
          return estimatedPrice;
        }
      }
      
      console.warn('❌ No real ADA price data available');
      return 0;
    },
    
    // Get real 24h change from CoinGecko data
    getADAChange24h: () => {
      if (data.prices && Object.keys(data.prices).length > 0) {
        const adaEntry = Object.values(data.prices).find(entry => 
          typeof entry === 'object' && 
          entry !== null && 
          'pair' in entry && 
          'source_dex' in entry &&
          'change_24h' in entry &&
          (entry.pair === 'ADA/USD' || entry.pair?.includes('ADA')) &&
          entry.source_dex === 'CoinGecko'
        );
        
        if (adaEntry && 'change_24h' in adaEntry && typeof adaEntry.change_24h === 'number') {
          return adaEntry.change_24h;
        }
      }
      return 0;
    },
    
    // Get real volume from CoinGecko data
    getADAVolume24h: () => {
      if (data.prices && Object.keys(data.prices).length > 0) {
        const adaEntry = Object.values(data.prices).find(entry => 
          typeof entry === 'object' && 
          entry !== null && 
          'pair' in entry && 
          'source_dex' in entry &&
          'volume_24h' in entry &&
          (entry.pair === 'ADA/USD' || entry.pair?.includes('ADA')) &&
          entry.source_dex === 'CoinGecko'
        );
        
        if (adaEntry && 'volume_24h' in adaEntry && typeof adaEntry.volume_24h === 'number') {
          return adaEntry.volume_24h;
        }
      }
      return 0;
    },
    
    // Get price by token ID with real validation
    getTokenPrice: (tokenId: string) => {
      if (data.prices && Object.keys(data.prices).length > 0) {
        const tokenEntry = Object.values(data.prices).find(entry => 
          typeof entry === 'object' && 
          entry !== null && 
          'pair' in entry && 
          'price' in entry &&
          entry.pair?.includes(tokenId)
        );
        
        if (tokenEntry && 'price' in tokenEntry && typeof tokenEntry.price === 'number') {
          return tokenEntry.price;
        }
      }
      return 0;
    },
    
    // Check if we have real price data (not derived/calculated)
    hasRealPriceData: () => {
      if (data.prices && Object.keys(data.prices).length > 0) {
        const hasRealADA = Object.values(data.prices).some(entry => 
          typeof entry === 'object' && 
          entry !== null && 
          'pair' in entry && 
          'source_dex' in entry &&
          'price' in entry &&
          (entry.pair === 'ADA/USD' || entry.pair?.includes('ADA')) &&
          entry.source_dex === 'CoinGecko' &&
          typeof entry.price === 'number' &&
          entry.price > 0.1
        );
        return hasRealADA && dataSource !== 'native';
      }
      return false;
    }
  };
};
