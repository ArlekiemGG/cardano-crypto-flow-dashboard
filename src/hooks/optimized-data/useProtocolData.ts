
import { useFetchOptimizedData } from './useFetchOptimizedData';
import { DeFiLlamaProtocol } from '@/services/optimized-data/types';

export const useProtocolData = () => {
  const { data } = useFetchOptimizedData();
  const protocols = data.protocols || [];

  return {
    protocols,
    
    // Utility methods for protocol data
    getTopProtocolsByTVL: (limit = 10): DeFiLlamaProtocol[] => {
      return [...protocols]
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, limit);
    },
    
    getTotalCardanoTVL: (): number => {
      return protocols.reduce((sum, protocol) => sum + (protocol.tvl || 0), 0);
    },
    
    getProtocolByName: (name: string): DeFiLlamaProtocol | undefined => {
      return protocols.find(p => 
        p.name.toLowerCase().includes(name.toLowerCase())
      );
    },
    
    getProtocolById: (id: string): DeFiLlamaProtocol | undefined => {
      return protocols.find(p => p.id === id);
    }
  };
};
