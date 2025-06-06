
import { useWallet } from '@/contexts/ModernWalletContext';
import { useRealMarketMakingPositions } from './useRealMarketMakingPositions';
import { useSpreadCalculations } from './useSpreadCalculations';
import { useRealMarketMakingStats } from './useRealMarketMakingStats';
import { useMarketMakingStrategies } from './useMarketMakingStrategies';

// Re-export types for backward compatibility
export type { RealMarketMakingPosition as MarketMakingPosition } from '@/types/marketMakingTypes';
export type { SpreadCalculation } from './useSpreadCalculations';
export type { MarketMakingStrategy } from './useMarketMakingStrategies';

export const useMarketMaking = () => {
  const { isConnected } = useWallet();
  const {
    positions,
    isLoading,
    addLiquidity,
    removeLiquidity,
    togglePosition,
    refetchPositions
  } = useRealMarketMakingPositions();
  
  const { calculateSpread } = useSpreadCalculations();
  const { stats } = useRealMarketMakingStats();
  const { strategies } = useMarketMakingStrategies();

  const getTotalStats = () => stats;

  return {
    positions,
    isLoading,
    calculateSpread,
    addLiquidity: (pair: string, amount: number) => {
      // For backwards compatibility, convert single amount to tokenA/tokenB amounts
      // In a real implementation, this would need proper token amounts and prices
      const tokenAAmount = amount * 0.5;
      const tokenBAmount = amount * 0.5;
      const priceA = 1.0; // Mock price
      const priceB = 1.0; // Mock price
      return addLiquidity(pair, 'Minswap', tokenAAmount, tokenBAmount, priceA, priceB);
    },
    removeLiquidity,
    togglePosition,
    getTotalStats,
    isConnected,
    strategies,
    refetchPositions
  };
};
