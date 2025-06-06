
import { supabase } from '@/integrations/supabase/client';
import { realTimeMarketDataService } from './realTimeMarketDataService';

interface ArbitrageOpportunityReal {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitPercentage: number;
  profitADA: number;
  volumeAvailable: number;
  totalFees: number;
  netProfit: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timeToExpiry: number;
  slippageRisk: number;
  liquidityScore: number;
  timestamp: string;
}

interface DEXFeeStructure {
  dex: string;
  tradingFee: number;
  withdrawalFee: number;
  networkFee: number;
  minimumTrade: number;
}

export class ArbitrageEngine {
  private readonly DEX_FEES: DEXFeeStructure[] = [
    { dex: 'Minswap', tradingFee: 0.003, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 },
    { dex: 'SundaeSwap', tradingFee: 0.003, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 5 },
    { dex: 'MuesliSwap', tradingFee: 0.0025, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 5 },
    { dex: 'WingRiders', tradingFee: 0.0035, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 }
  ];

  private readonly MIN_PROFIT_PERCENTAGE = 0.3; // Lowered threshold for more opportunities
  private readonly MIN_VOLUME_ADA = 50; // Lowered minimum volume
  private readonly MAX_SLIPPAGE = 8; // Increased tolerance

  async scanForArbitrageOpportunities(): Promise<ArbitrageOpportunityReal[]> {
    console.log('🔍 Scanning for real arbitrage opportunities...');
    
    try {
      const currentPrices = await realTimeMarketDataService.getCurrentPrices();
      console.log(`📊 Found ${currentPrices.length} current price entries from database`);
      
      if (currentPrices.length === 0) {
        console.log('⚠️ No current prices available, returning empty opportunities');
        return [];
      }

      const opportunities: ArbitrageOpportunityReal[] = [];

      // Group prices by pair
      const pairGroups = new Map<string, typeof currentPrices>();
      currentPrices.forEach(price => {
        const normalizedPair = this.normalizePair(price.pair);
        if (!pairGroups.has(normalizedPair)) {
          pairGroups.set(normalizedPair, []);
        }
        pairGroups.get(normalizedPair)!.push(price);
      });

      console.log(`🔗 Grouped prices into ${pairGroups.size} unique pairs`);

      // Analyze each pair for arbitrage opportunities
      for (const [pair, prices] of pairGroups) {
        if (prices.length >= 2) {
          const pairOpportunities = await this.analyzeArbitrageForPair(pair, prices);
          opportunities.push(...pairOpportunities);
        }
      }

      // Filter and rank opportunities
      const validOpportunities = opportunities
        .filter(opp => opp.profitPercentage >= this.MIN_PROFIT_PERCENTAGE)
        .filter(opp => opp.volumeAvailable >= this.MIN_VOLUME_ADA)
        .filter(opp => opp.slippageRisk <= this.MAX_SLIPPAGE)
        .sort((a, b) => b.netProfit - a.netProfit);

      // Store in database
      await this.storeOpportunities(validOpportunities);

      console.log(`✅ Found ${validOpportunities.length} valid arbitrage opportunities out of ${opportunities.length} total`);
      return validOpportunities;

    } catch (error) {
      console.error('❌ Error scanning for arbitrage opportunities:', error);
      return [];
    }
  }

  private async analyzeArbitrageForPair(pair: string, prices: any[]): Promise<ArbitrageOpportunityReal[]> {
    const opportunities: ArbitrageOpportunityReal[] = [];

    // Compare all price combinations
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const price1 = prices[i];
        const price2 = prices[j];

        // Determine buy and sell DEXs
        const [buyPrice, sellPrice, buyDex, sellDex] = 
          price1.price < price2.price 
            ? [price1, price2, price1.dex, price2.dex]
            : [price2, price1, price2.dex, price1.dex];

        // Calculate raw profit
        const priceDiff = sellPrice.price - buyPrice.price;
        const rawProfitPercentage = (priceDiff / buyPrice.price) * 100;

        if (rawProfitPercentage > 0.05) { // Only consider if > 0.05% raw profit
          // Calculate all fees
          const buyFees = this.calculateDEXFees(buyDex, buyPrice.price);
          const sellFees = this.calculateDEXFees(sellDex, sellPrice.price);
          const totalFees = buyFees + sellFees;

          // Calculate available volume (use smaller of the two liquidity values)
          const volumeAvailable = Math.min(
            Math.max(buyPrice.volume24h * 0.05, 100), // At least 100 ADA
            Math.max(sellPrice.volume24h * 0.05, 100)
          );

          // Calculate net profit
          const grossProfit = priceDiff * volumeAvailable;
          const totalFeesForVolume = totalFees * volumeAvailable;
          const netProfit = grossProfit - totalFeesForVolume;
          const netProfitPercentage = (netProfit / (buyPrice.price * volumeAvailable)) * 100;

          // Calculate liquidity and slippage scores
          const liquidityScore = this.calculateLiquidityScore(buyPrice.liquidity, sellPrice.liquidity);
          const slippageRisk = this.calculateSlippageRisk(volumeAvailable, liquidityScore);

          // Determine confidence level
          const confidence = this.calculateConfidence(netProfitPercentage, liquidityScore, slippageRisk);

          if (netProfitPercentage > 0 && netProfit > 0) {
            opportunities.push({
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
              timeToExpiry: 300, // 5 minutes
              slippageRisk,
              liquidityScore,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    return opportunities;
  }

  private calculateDEXFees(dexName: string, price: number): number {
    const dexFee = this.DEX_FEES.find(fee => fee.dex === dexName);
    if (!dexFee) return 0.005; // Default 0.5% if not found

    return dexFee.tradingFee + dexFee.withdrawalFee + (dexFee.networkFee / price);
  }

  private calculateLiquidityScore(buyLiquidity: number, sellLiquidity: number): number {
    const avgLiquidity = (buyLiquidity + sellLiquidity) / 2;
    if (avgLiquidity > 1000000) return 100;
    if (avgLiquidity > 500000) return 80;
    if (avgLiquidity > 100000) return 60;
    if (avgLiquidity > 50000) return 40;
    return Math.max(20, Math.min(40, avgLiquidity / 1000));
  }

  private calculateSlippageRisk(volume: number, liquidityScore: number): number {
    const baseSlippage = (volume / (liquidityScore * 100)) * 100;
    return Math.min(15, Math.max(0.1, baseSlippage));
  }

  private calculateConfidence(profitPercentage: number, liquidityScore: number, slippageRisk: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    const score = profitPercentage * 5 + liquidityScore * 0.5 - slippageRisk * 2;
    
    if (score > 70) return 'HIGH';
    if (score > 40) return 'MEDIUM';
    return 'LOW';
  }

  private normalizePair(pair: string): string {
    return pair.toUpperCase().replace(/\s+/g, '').replace('/', '-');
  }

  private async storeOpportunities(opportunities: ArbitrageOpportunityReal[]) {
    // Clear old opportunities first
    try {
      await supabase
        .from('arbitrage_opportunities')
        .delete()
        .lt('timestamp', new Date(Date.now() - 600000).toISOString()); // Clear opportunities older than 10 minutes
    } catch (error) {
      console.error('Error clearing old opportunities:', error);
    }

    // Insert new opportunities
    for (const opp of opportunities) {
      try {
        await supabase
          .from('arbitrage_opportunities')
          .insert({
            dex_pair: opp.pair,
            source_dex_a: opp.buyDex,
            source_dex_b: opp.sellDex,
            price_a: opp.buyPrice,
            price_b: opp.sellPrice,
            price_diff: opp.sellPrice - opp.buyPrice,
            profit_potential: opp.profitPercentage,
            volume_available: opp.volumeAvailable,
            confidence_score: opp.confidence === 'HIGH' ? 90 : opp.confidence === 'MEDIUM' ? 70 : 50,
            is_active: true,
            timestamp: opp.timestamp
          });
      } catch (error) {
        console.error('Error storing opportunity:', error);
      }
    }
  }

  // Method to simulate trade execution for validation
  async simulateTradeExecution(opportunity: ArbitrageOpportunityReal): Promise<{
    success: boolean;
    estimatedProfit: number;
    estimatedSlippage: number;
    gasEstimate: number;
    timeEstimate: number;
  }> {
    console.log(`🧪 Simulating trade execution for ${opportunity.pair}`);

    try {
      // Simulate buy order
      const buySlippage = Math.random() * opportunity.slippageRisk;
      const actualBuyPrice = opportunity.buyPrice * (1 + buySlippage / 100);

      // Simulate sell order
      const sellSlippage = Math.random() * opportunity.slippageRisk;
      const actualSellPrice = opportunity.sellPrice * (1 - sellSlippage / 100);

      // Calculate actual profit
      const actualProfit = (actualSellPrice - actualBuyPrice) * opportunity.volumeAvailable - opportunity.totalFees;
      const totalSlippage = buySlippage + sellSlippage;

      // Estimate gas costs
      const gasEstimate = 0.5; // 0.5 ADA for transaction fees

      // Estimate execution time
      const timeEstimate = 120; // 2 minutes average

      return {
        success: actualProfit > 0,
        estimatedProfit: actualProfit,
        estimatedSlippage: totalSlippage,
        gasEstimate,
        timeEstimate
      };

    } catch (error) {
      console.error('Error simulating trade:', error);
      return {
        success: false,
        estimatedProfit: 0,
        estimatedSlippage: 100,
        gasEstimate: 0,
        timeEstimate: 0
      };
    }
  }

  async getArbitragePerformance(days = 7): Promise<{
    totalOpportunities: number;
    avgProfitPercentage: number;
    successRate: number;
    totalVolume: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('arbitrage_opportunities')
      .select('profit_potential, volume_available, is_active')
      .gte('timestamp', startDate);

    if (error) {
      console.error('Error fetching arbitrage performance:', error);
      return { totalOpportunities: 0, avgProfitPercentage: 0, successRate: 0, totalVolume: 0 };
    }

    const totalOpportunities = data?.length || 0;
    const avgProfitPercentage = totalOpportunities > 0 
      ? data?.reduce((sum, opp) => sum + Number(opp.profit_potential), 0) / totalOpportunities || 0
      : 0;
    const successRate = totalOpportunities > 0 
      ? (data?.filter(opp => opp.is_active).length / totalOpportunities * 100) || 0
      : 0;
    const totalVolume = data?.reduce((sum, opp) => sum + Number(opp.volume_available), 0) || 0;

    return {
      totalOpportunities,
      avgProfitPercentage,
      successRate,
      totalVolume
    };
  }
}

export const arbitrageEngine = new ArbitrageEngine();
