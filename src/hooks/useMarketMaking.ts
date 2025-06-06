
import { useWallet } from '@/contexts/ModernWalletContext';
import { useMarketMakingPositions } from './useMarketMakingPositions';
import { useSpreadCalculations } from './useSpreadCalculations';
import { useMarketMakingStats } from './useMarketMakingStats';

// Re-export types for backward compatibility
export type { MarketMakingPosition } from './useMarketMakingPositions';
export type { SpreadCalculation } from './useSpreadCalculations';

export const useMarketMaking = () => {
  const { isConnected } = useWallet();
  const {
    positions,
    isLoading,
    addLiquidity,
    removeLiquidity,
    togglePosition
  } = useMarketMakingPositions();
  
  const { calculateSpread } = useSpreadCalculations();
  const { getTotalStats } = useMarketMakingStats(positions);

  return {
    positions,
    isLoading,
    calculateSpread,
    addLiquidity,
    removeLiquidity,
    togglePosition,
    getTotalStats,
    isConnected
  };
};
