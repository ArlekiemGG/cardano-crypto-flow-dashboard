import { ExtendedMarketData, ArbitrageOpportunityReal, ArbitrageConfig } from './types';
import { feeCalculationService } from './feeCalculationService';

export class OpportunityAnalysisService {
  private config: ArbitrageConfig = {
    MIN_PROFIT_PERCENTAGE: 0.8,
    MIN_VOLUME_ADA: 50,
    MAX_SLIPPAGE: 4,
    MIN_CONFIDENCE_FOR_AUTO_TRADES: 'HIGH',
    MIN_PRICE_DIFFERENCE: 0.001,
    SCAN_COOLDOWN: 45000
  };

  private normalizePair(pair: string): string {
    return pair.toUpperCase().replace(/\s+/g, '').replace(/[\/\-]/g, '/');
  }

  groupPricesByPair(prices: ExtendedMarketData[]): Map<string, ExtendedMarketData[]> {
    const pairGroups = new Map<string, ExtendedMarketData[]>();
    
    prices.forEach(price => {
      const normalizedPair = this.normalizePair(price.pair);
      if (!pairGroups.has(normalizedPair)) {
        pairGroups.set(normalizedPair, []);
      }
      pairGroups.get(normalizedPair)!.push(price);
    });

    return pairGroups;
  }

  async analyzeArbitrageForPair(pair: string, prices: ExtendedMarketData[]): Promise<ArbitrageOpportunityReal[]> {
    const opportunities: ArbitrageOpportunityReal[] = [];

    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const price1 = prices[i];
        const price2 = prices[j];

        if (price1.dex === price2.dex) continue;

        const priceDiff = Math.abs(price1.price - price2.price);
        
        // Skip if price difference is too small
        if (priceDiff < this.config.MIN_PRICE_DIFFERENCE) continue;

        const [buyPrice, sellPrice, buyDex, sellDex] = 
          price1.price < price2.price 
            ? [price1, price2, price1.dex, price2.dex]
            : [price2, price1, price2.dex, price1.dex];

        const rawProfitPercentage = (priceDiff / buyPrice.price) * 100;

        // More realistic profit threshold
        if (rawProfitPercentage > 0.5 && rawProfitPercentage < 15) {
          const opportunity = await this.calculateOpportunity(
            pair, buyPrice, sellPrice, buyDex, sellDex, priceDiff, rawProfitPercentage
          );

          if (opportunity && this.isViableOpportunity(opportunity)) {
            opportunities.push(opportunity);
          }
        }
      }
    }

    return opportunities;
  }

  private async calculateOpportunity(
    pair: string, 
    buyPrice: ExtendedMarketData, 
    sellPrice: ExtendedMarketData, 
    buyDex: string, 
    sellDex: string, 
    priceDiff: number, 
    rawProfitPercentage: number
  ): Promise<ArbitrageOpportunityReal | null> {
    try {
      const buyFees = feeCalculationService.calculateDEXFees(buyDex, buyPrice.price);
      const sellFees = feeCalculationService.calculateDEXFees(sellDex, sellPrice.price);
      const totalFees = buyFees + sellFees;

      // Improved volume calculation
      const volumeAvailable = Math.min(
        buyPrice.volume24h * 0.02,
        sellPrice.volume24h * 0.02,
        Math.max(buyPrice.liquidity * 0.005, 100),
        Math.max(sellPrice.liquidity * 0.005, 100),
        500
      );

      const grossProfit = priceDiff * volumeAvailable;
      const totalFeesForVolume = totalFees * volumeAvailable;
      const netProfit = grossProfit - totalFeesForVolume;
      const netProfitPercentage = (netProfit / (buyPrice.price * volumeAvailable)) * 100;

      const liquidityScore = feeCalculationService.calculateLiquidityScore(buyPrice.liquidity, sellPrice.liquidity);
      const slippageRisk = feeCalculationService.calculateSlippageRisk(volumeAvailable, liquidityScore);
      const confidence = feeCalculationService.calculateConfidence(
        netProfitPercentage, 
        liquidityScore, 
        slippageRisk,
        priceDiff,
        volumeAvailable
      );

      return {
        id: `${pair}-${buyDex}-${sellDex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pair,
        buyDex,
        sellDex,
        buyPrice: buyPrice.price,
        sellPrice: sellPrice.price,
        profitPercentage: netProfitPercentage,
        profitADA: netProfit,
        volumeAvailable,
        totalFees: totalFeesForVolume,
        netProfit,
        confidence,
        timeToExpiry: 120,
        slippageRisk,
        liquidityScore,
        timestamp: new Date().toISOString(),
        executionReady: confidence === 'HIGH' && netProfit > 5
      };
    } catch (error) {
      console.error('Error calculating opportunity:', error);
      return null;
    }
  }

  private isViableOpportunity(opportunity: ArbitrageOpportunityReal): boolean {
    return opportunity.profitPercentage >= this.config.MIN_PROFIT_PERCENTAGE &&
           opportunity.volumeAvailable >= this.config.MIN_VOLUME_ADA &&
           opportunity.slippageRisk <= this.config.MAX_SLIPPAGE &&
           opportunity.netProfit > 2 &&
           opportunity.confidence !== 'LOW';
  }

  filterAndRankOpportunities(opportunities: ArbitrageOpportunityReal[]): ArbitrageOpportunityReal[] {
    return opportunities
      .filter(opp => this.isViableOpportunity(opp))
      .sort((a, b) => {
        // Rank by confidence first, then by net profit
        const confidenceScore = (conf: string) => conf === 'HIGH' ? 3 : conf === 'MEDIUM' ? 2 : 1;
        const aScore = confidenceScore(a.confidence) * 1000 + a.netProfit;
        const bScore = confidenceScore(b.confidence) * 1000 + b.netProfit;
        return bScore - aScore;
      })
      .slice(0, 12);
  }
}

export const opportunityAnalysisService = new OpportunityAnalysisService();
