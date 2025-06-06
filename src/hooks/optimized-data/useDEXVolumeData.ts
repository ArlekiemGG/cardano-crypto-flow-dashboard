
import { useFetchOptimizedData } from './useFetchOptimizedData';

export const useDEXVolumeData = () => {
  const { data, isLoading, dataSource, lastUpdate } = useFetchOptimizedData();

  return {
    dexVolumes: data.dexVolumes,
    isLoading,
    dataSource,
    lastUpdate,
    
    // Get DEX volume by name
    getDexVolumeByName: (dexName: string) => {
      if (!data.dexVolumes?.protocols) return 0;
      
      const dex = data.dexVolumes.protocols.find((protocol: any) => 
        protocol.name?.toLowerCase().includes(dexName.toLowerCase())
      );
      
      return dex?.total24h || 0;
    },
    
    // Get total DEX volume across all DEXs
    getTotalDexVolume24h: () => {
      if (!data.dexVolumes?.protocols) return 0;
      
      return data.dexVolumes.protocols.reduce((total: number, protocol: any) => {
        return total + (protocol.total24h || 0);
      }, 0);
    },
    
    // Get top DEXs by volume
    getTopDEXsByVolume: (limit: number = 5) => {
      if (!data.dexVolumes?.protocols) return [];
      
      return data.dexVolumes.protocols
        .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0))
        .slice(0, limit);
    },
    
    // Get count of active DEXs
    getDEXCount: () => {
      if (!data.dexVolumes?.protocols) return 0;
      return data.dexVolumes.protocols.length;
    }
  };
};
