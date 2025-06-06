
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/ModernWalletContext';

export interface RealMarketMakingStats {
  totalLiquidity: number;
  totalFeesEarned: number;
  totalVolume: number;
  activePairs: number;
  avgAPY: number;
  totalPositions: number;
  profitLoss: number;
}

export const useRealMarketMakingStats = () => {
  const [stats, setStats] = useState<RealMarketMakingStats>({
    totalLiquidity: 0,
    totalFeesEarned: 0,
    totalVolume: 0,
    activePairs: 0,
    avgAPY: 0,
    totalPositions: 0,
    profitLoss: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, walletAddress } = useWallet();

  const fetchStats = async () => {
    if (!isConnected || !walletAddress) return;

    setIsLoading(true);
    try {
      const { data: positions, error } = await supabase
        .from('market_making_positions')
        .select('*')
        .eq('user_wallet', walletAddress);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      if (!positions || positions.length === 0) {
        setStats({
          totalLiquidity: 0,
          totalFeesEarned: 0,
          totalVolume: 0,
          activePairs: 0,
          avgAPY: 0,
          totalPositions: 0,
          profitLoss: 0
        });
        return;
      }

      const activePositions = positions.filter(p => p.status === 'active');
      
      const totalLiquidity = positions.reduce((sum, p) => sum + (p.liquidity_provided || 0), 0);
      const totalFeesEarned = positions.reduce((sum, p) => sum + (p.fees_earned || 0), 0);
      const totalVolume = positions.reduce((sum, p) => sum + (p.volume_24h || 0), 0);
      const activePairs = new Set(activePositions.map(p => p.pair)).size;
      const avgAPY = activePositions.length > 0 
        ? activePositions.reduce((sum, p) => sum + (p.apy || 0), 0) / activePositions.length 
        : 0;
      const profitLoss = positions.reduce((sum, p) => 
        sum + (p.fees_earned || 0) + (p.impermanent_loss || 0), 0
      );

      setStats({
        totalLiquidity,
        totalFeesEarned,
        totalVolume,
        activePairs,
        avgAPY,
        totalPositions: positions.length,
        profitLoss
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchStats();
    }
  }, [isConnected, walletAddress]);

  return {
    stats,
    isLoading,
    refetchStats: fetchStats
  };
};
