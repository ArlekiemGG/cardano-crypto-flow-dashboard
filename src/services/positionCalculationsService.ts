
import type { RealMarketMakingPosition } from '@/types/marketMakingTypes';

export class PositionCalculationsService {
  static calculateCurrentSpread(position: RealMarketMakingPosition, currentPriceA: number, currentPriceB: number): number {
    const entryRatio = position.entryPriceA / position.entryPriceB;
    const currentRatio = currentPriceA / currentPriceB;
    return Math.abs((currentRatio - entryRatio) / entryRatio);
  }

  static calculateAPY(position: RealMarketMakingPosition): number {
    const daysSinceCreation = (Date.now() - new Date(position.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation === 0) return 0;
    
    const dailyReturn = position.feesEarned / position.liquidityProvided / daysSinceCreation;
    return dailyReturn * 365 * 100; // Convert to percentage
  }

  static calculateImpermanentLoss(
    position: RealMarketMakingPosition,
    currentPriceA: number,
    currentPriceB: number
  ): number {
    const entryRatio = position.entryPriceA / position.entryPriceB;
    const currentRatio = currentPriceA / currentPriceB;
    const priceRatioChange = currentRatio / entryRatio;
    
    // Simplified IL calculation for 50/50 pools
    const ilFactor = 2 * Math.sqrt(priceRatioChange) / (1 + priceRatioChange) - 1;
    return ilFactor * position.liquidityProvided;
  }

  static updatePositionMetrics(
    position: RealMarketMakingPosition,
    currentPriceA: number,
    currentPriceB: number,
    newFeesEarned: number = 0
  ): Partial<RealMarketMakingPosition> {
    const currentSpread = this.calculateCurrentSpread(position, currentPriceA, currentPriceB);
    const impermanentLoss = this.calculateImpermanentLoss(position, currentPriceA, currentPriceB);
    const feesEarned = position.feesEarned + newFeesEarned;
    
    const updatedPosition = {
      ...position,
      currentSpread,
      impermanentLoss,
      feesEarned,
    };
    
    const apy = this.calculateAPY(updatedPosition);
    
    return {
      currentSpread,
      impermanentLoss,
      feesEarned,
      apy,
      updatedAt: new Date().toISOString()
    };
  }
}
