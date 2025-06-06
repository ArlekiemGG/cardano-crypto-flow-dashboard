
import { MarketMakingPosition } from './useMarketMakingPositions';

export interface MarketMakingStats {
  totalLiquidity: number;
  totalFeesEarned: number;
  totalVolume: number;
  activePairs: number;
  avgAPY: number;
}

export const useMarketMakingStats = (positions: MarketMakingPosition[]) => {
  const getTotalStats = (): MarketMakingStats => {
    const totalLiquidity = positions.reduce((sum, p) => sum + p.liquidityProvided, 0);
    const totalFeesEarned = positions.reduce((sum, p) => sum + p.feesEarned, 0);
    const totalVolume = positions.reduce((sum, p) => sum + p.volume24h, 0);
    const activePairs = positions.filter(p => p.status === 'active').length;
    const avgAPY = positions.length > 0 
      ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length 
      : 0;

    return {
      totalLiquidity,
      totalFeesEarned,
      totalVolume,
      activePairs,
      avgAPY
    };
  };

  return {
    getTotalStats
  };
};
