
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

  private readonly MIN_PROFIT_PERCENTAGE = 0.5; // 0.5% minimum profit
  private readonly MIN_VOLUME_ADA = 100; // Minimum 100 ADA volume
  private readonly MAX_SLIPPAGE = 5; // Maximum 5% slippage tolerance

  async scanForArbitrageOpportunities(): Promise<ArbitrageOpportunityReal[]> {
    console.log('🔍 Scanning for real arbitrage opportunities...');
    
    try {
      const currentPrices = await realTimeMarketDataService.getCurrentPrices();
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

      console.log(`✅ Found ${validOpportunities.length} valid arbitrage opportunities`);
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

        if (rawProfitPercentage > 0.1) { // Only consider if > 0.1% raw profit
          // Calculate all fees
          const buyFees = this.calculateDEXFees(buyDex, buyPrice.price);
          const sellFees = this.calculateDEXFees(sellDex, sellPrice.price);
          const totalFees = buyFees + sellFees;

          // Calculate net profit
          const grossProfit = priceDiff;
          const netProfit = grossProfit - totalFees;
          const netProfitPercentage = (netProfit / buyPrice.price) * 100;

          // Calculate available volume (limited by smaller volume)
          const volumeAvailable = Math.min(buyPrice.volume24h, sellPrice.volume24h) * 0.1; // Use 10% of 24h volume

          // Calculate liquidity and slippage scores
          const liquidityScore = this.calculateLiquidityScore(buyPrice.liquidity, sellPrice.liquidity);
          const slippageRisk = this.calculateSlippageRisk(volumeAvailable, liquidityScore);

          // Determine confidence level
          const confidence = this.calculateConfidence(netProfitPercentage, liquidityScore, slippageRisk);

          if (netProfitPercentage > 0) {
            opportunities.push({
              id: `${pair}-${buyDex}-${sellDex}-${Date.now()}`,
              pair,
              buyDex,
              sellDex,
              buyPrice: buyPrice.price,
              sellPrice: sellPrice.price,
              profitPercentage: netProfitPercentage,
              profitADA: netProfit * volumeAvailable,
              volumeAvailable,
              totalFees,
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
    if (!dexFee) return 0.005 * price; // Default 0.5% if not found

    return (dexFee.tradingFee + dexFee.withdrawalFee) * price + dexFee.networkFee;
  }

  private calculateLiquidityScore(buyLiquidity: number, sellLiquidity: number): number {
    const avgLiquidity = (buyLiquidity + sellLiquidity) / 2;
    if (avgLiquidity > 1000000) return 100;
    if (avgLiquidity > 500000) return 80;
    if (avgLiquidity > 100000) return 60;
    if (avgLiquidity > 50000) return 40;
    return 20;
  }

  private calculateSlippageRisk(volume: number, liquidityScore: number): number {
    const baseSlippage = volume / (liquidityScore * 1000);
    return Math.min(10, Math.max(0.1, baseSlippage));
  }

  private calculateConfidence(profitPercentage: number, liquidityScore: number, slippageRisk: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    const score = profitPercentage * 10 + liquidityScore - slippageRisk * 10;
    
    if (score > 80) return 'HIGH';
    if (score > 50) return 'MEDIUM';
    return 'LOW';
  }

  private normalizePair(pair: string): string {
    return pair.toUpperCase().replace(/\s+/g, '').replace('/', '-');
  }

  private async storeOpportunities(opportunities: ArbitrageOpportunityReal[]) {
    // Clear old opportunities
    await supabase
      .from('arbitrage_opportunities')
      .delete()
      .lt('timestamp', new Date(Date.now() - 300000).toISOString());

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
      const actualProfit = (actualSellPrice - actualBuyPrice) * opportunity.volumeAvailable;
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

  // Get historical arbitrage performance
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
    const avgProfitPercentage = data?.reduce((sum, opp) => sum + Number(opp.profit_potential), 0) / totalOpportunities || 0;
    const successRate = data?.filter(opp => opp.is_active).length / totalOpportunities * 100 || 0;
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
