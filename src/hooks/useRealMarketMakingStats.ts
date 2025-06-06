
import { useState, useEffect, useMemo } from 'react';
import { useRealMarketMakingPositions } from './useRealMarketMakingPositions';
import { useOptimizedMarketData } from './useOptimizedMarketData';

export interface RealMarketMakingStats {
  totalLiquidity: number;
  totalFeesEarned: number;
  avgAPY: number;
  activePairs: number;
  totalPositions: number;
  profitLoss: number;
  impermanentLossTotal: number;
  totalVolume: number;
  bestPerformingPair: string;
  worstPerformingPair: string;
}

export const useRealMarketMakingStats = () => {
  const { positions } = useRealMarketMakingPositions();
  const { getADAPrice } = useOptimizedMarketData();
  
  const stats = useMemo((): RealMarketMakingStats => {
    if (positions.length === 0) {
      return {
        totalLiquidity: 0,
        totalFeesEarned: 0,
        avgAPY: 0,
        activePairs: 0,
        totalPositions: 0,
        profitLoss: 0,
        impermanentLossTotal: 0,
        totalVolume: 0,
        bestPerformingPair: '',
        worstPerformingPair: ''
      };
    }

    const activePositions = positions.filter(p => p.status === 'active');
    const totalLiquidity = positions.reduce((sum, pos) => sum + pos.totalValueADA, 0);
    const totalFeesEarned = positions.reduce((sum, pos) => sum + pos.feesEarnedTotal, 0);
    const avgAPY = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos.currentAPR, 0) / positions.length 
      : 0;
    
    const profitLoss = totalFeesEarned - positions.reduce((sum, pos) => sum + Math.abs(pos.impermanentLoss), 0);
    const impermanentLossTotal = positions.reduce((sum, pos) => sum + pos.impermanentLoss, 0);
    
    // Find best and worst performing pairs
    const pairPerformance = positions.reduce((acc, pos) => {
      const key = pos.pair;
      if (!acc[key]) {
        acc[key] = { totalAPR: 0, count: 0 };
      }
      acc[key].totalAPR += pos.currentAPR;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { totalAPR: number; count: number }>);

    const pairAPRs = Object.entries(pairPerformance).map(([pair, data]) => ({
      pair,
      avgAPR: data.totalAPR / data.count
    }));

    pairAPRs.sort((a, b) => b.avgAPR - a.avgAPR);
    
    return {
      totalLiquidity,
      totalFeesEarned,
      avgAPY,
      activePairs: new Set(activePositions.map(p => p.pair)).size,
      totalPositions: positions.length,
      profitLoss,
      impermanentLossTotal,
      totalVolume: totalLiquidity * 2, // Approximate volume calculation
      bestPerformingPair: pairAPRs[0]?.pair || '',
      worstPerformingPair: pairAPRs[pairAPRs.length - 1]?.pair || ''
    };
  }, [positions]);

  return { stats };
};
