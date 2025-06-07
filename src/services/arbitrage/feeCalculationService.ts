
import { DEXFeeStructure } from './types';

export class FeeCalculationService {
  private readonly DEX_FEES: DEXFeeStructure[] = [
    { dex: 'Minswap', tradingFee: 0.003, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 },
    { dex: 'SundaeSwap', tradingFee: 0.003, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 5 },
    { dex: 'MuesliSwap', tradingFee: 0.0025, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 5 },
    { dex: 'WingRiders', tradingFee: 0.0035, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 },
    { dex: 'DeFiLlama', tradingFee: 0.002, withdrawalFee: 0.0005, networkFee: 0.17, minimumTrade: 5 }
  ];

  calculateDEXFees(dexName: string, price: number): number {
    const dexFee = this.DEX_FEES.find(fee => fee.dex === dexName);
    if (!dexFee) return 0.004; // Default 0.4% if DEX not found

    return dexFee.tradingFee + dexFee.withdrawalFee + (dexFee.networkFee / price);
  }

  calculateLiquidityScore(buyLiquidity: number, sellLiquidity: number): number {
    const avgLiquidity = (buyLiquidity + sellLiquidity) / 2;
    
    // Adjusted liquidity scoring for better detection
    if (avgLiquidity > 500000) return 95;
    if (avgLiquidity > 250000) return 85;
    if (avgLiquidity > 100000) return 75;
    if (avgLiquidity > 50000) return 65;
    if (avgLiquidity > 25000) return 55;
    if (avgLiquidity > 10000) return 45;
    return Math.max(25, Math.min(45, (avgLiquidity / 1000) * 2));
  }

  calculateSlippageRisk(volume: number, liquidityScore: number): number {
    // More flexible slippage calculation
    const liquidityFactor = liquidityScore / 100;
    const baseSlippage = (volume / (liquidityFactor * 50000)) * 100; // Reduced divisor
    
    // Reduced market impact penalty
    const marketImpact = volume > 400 ? (volume - 400) * 0.0005 : 0;
    
    return Math.min(6, Math.max(0.1, baseSlippage + marketImpact));
  }

  calculateConfidence(
    profitPercentage: number, 
    liquidityScore: number, 
    slippageRisk: number,
    priceDiff: number,
    volume: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Adjusted confidence calculation for more opportunities
    let score = 0;
    
    // Profit factor
    score += Math.min(40, profitPercentage * 10);
    
    // Liquidity factor
    score += liquidityScore * 0.35;
    
    // Slippage penalty (less severe)
    score -= slippageRisk * 4;
    
    // Price difference factor (less restrictive)
    if (priceDiff < 0.01) score -= 15;
    
    // Volume factor
    score += Math.min(15, volume / 40);
    
    // More balanced thresholds
    if (score > 80) return 'HIGH';
    if (score > 60) return 'MEDIUM';
    return 'LOW';
  }
}

export const feeCalculationService = new FeeCalculationService();
