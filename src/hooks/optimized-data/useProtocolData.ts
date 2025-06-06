
import { useFetchOptimizedData } from './useFetchOptimizedData';

export const useProtocolData = () => {
  const { data, isLoading, dataSource, lastUpdate } = useFetchOptimizedData();

  return {
    protocols: data.protocols,
    isLoading,
    dataSource,
    lastUpdate,
    
    // Get top protocols by TVL
    getTopProtocolsByTVL: (limit: number = 10) => {
      if (!data.protocols) return [];
      
      return data.protocols
        .filter(protocol => protocol.tvl > 0)
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, limit);
    },
    
    // Get total Cardano ecosystem TVL
    getTotalCardanoTVL: () => {
      if (!data.protocols) return 0;
      
      return data.protocols.reduce((total, protocol) => {
        return total + (protocol.tvl || 0);
      }, 0);
    },
    
    // Get protocol by name
    getProtocolByName: (name: string) => {
      if (!data.protocols) return null;
      
      return data.protocols.find(protocol => 
        protocol.name?.toLowerCase().includes(name.toLowerCase())
      ) || null;
    },
    
    // Get protocol by ID
    getProtocolById: (id: string) => {
      if (!data.protocols) return null;
      
      return data.protocols.find(protocol => protocol.id === id) || null;
    }
  };
};
