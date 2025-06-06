
import { useState, useEffect } from 'react';
import { dexService } from '@/services/dexService';

interface DEXVolume {
  dex: string;
  totalVolume: number;
}

export const useDEXVolumes = () => {
  const [dexVolumes, setDexVolumes] = useState<DEXVolume[]>([]);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDEXVolumes = async () => {
    try {
      console.log('🔄 Fetching DEX volumes...');
      const volumes = await dexService.getRealVolumes();
      const total = volumes.reduce((sum, dex) => sum + dex.totalVolume, 0);
      
      setDexVolumes(volumes);
      setTotalVolume(total);
      setLastUpdate(new Date());
      setIsLoading(false);
      
      console.log('✅ DEX volumes updated:', { volumes, total });
    } catch (error) {
      console.error('❌ Error fetching DEX volumes:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchDEXVolumes();

    // Update every 30 seconds
    const interval = setInterval(fetchDEXVolumes, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    dexVolumes,
    totalVolume,
    isLoading,
    lastUpdate,
    refreshVolumes: fetchDEXVolumes
  };
};
