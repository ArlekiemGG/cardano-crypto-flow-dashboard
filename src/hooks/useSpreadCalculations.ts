
import { useOptimizedMarketData } from './useOptimizedMarketData';

export interface SpreadCalculation {
  pair: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  estimatedProfit: number;
}

export const useSpreadCalculations = () => {
  const { getADAPrice } = useOptimizedMarketData();

  const calculateSpread = (pair: string, amount: number): SpreadCalculation => {
    const adaPrice = getADAPrice();
    const basePrice = pair.includes('ADA') ? adaPrice : 1.0;
    
    // Simulate market depth and spread calculation
    const marketDepth = Math.random() * 0.5 + 0.1; // 0.1% to 0.6%
    const buyPrice = basePrice * (1 + marketDepth);
    const sellPrice = basePrice * (1 - marketDepth);
    const spread = buyPrice - sellPrice;
    const spreadPercentage = (spread / basePrice) * 100;
    const estimatedProfit = (amount * spreadPercentage) / 100;

    return {
      pair,
      buyPrice,
      sellPrice,
      spread,
      spreadPercentage,
      estimatedProfit
    };
  };

  return {
    calculateSpread
  };
};
