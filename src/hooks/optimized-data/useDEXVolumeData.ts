
import { useFetchOptimizedData } from './useFetchOptimizedData';

export interface DEXProtocol {
  name: string;
  total24h: number;
  change_1d: number;
  change_7d: number;
}

export const useDEXVolumeData = () => {
  const { data } = useFetchOptimizedData();
  const dexVolumes = data.dexVolumes;

  return {
    dexVolumes,
    
    getDexVolumeByName: (dexName: string): DEXProtocol | undefined => {
      return dexVolumes?.protocols?.find((dex: any) => 
        dex.name?.toLowerCase().includes(dexName.toLowerCase())
      );
    },

    getTotalDexVolume24h: (): number => {
      if (!dexVolumes?.protocols) return 0;
      return dexVolumes.protocols.reduce((sum: number, dex: any) => 
        sum + (dex.total24h || 0), 0
      );
    },
    
    getTopDEXsByVolume: (limit = 5): DEXProtocol[] => {
      if (!dexVolumes?.protocols) return [];
      return [...dexVolumes.protocols]
        .sort((a: any, b: any) => b.total24h - a.total24h)
        .slice(0, limit);
    },
    
    getDEXCount: (): number => {
      return dexVolumes?.protocols?.length || 0;
    }
  };
};
