import { supabase } from '@/integrations/supabase/client';
import { realTimeMarketDataService } from './realTimeMarketDataService';
import { realTradingService } from './realTradingService';

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
  executionReady?: boolean;
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
    { dex: 'WingRiders', tradingFee: 0.0035, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 },
    { dex: 'CoinGecko', tradingFee: 0, withdrawalFee: 0, networkFee: 0, minimumTrade: 0 }
  ];

  // More conservative thresholds for REAL trading
  private readonly MIN_PROFIT_PERCENTAGE = 1.5; // Higher threshold for real trades
  private readonly MIN_VOLUME_ADA = 100; // Higher minimum volume
  private readonly MAX_SLIPPAGE = 3; // Lower slippage tolerance
  private readonly MIN_CONFIDENCE_FOR_REAL_TRADES = 'HIGH'; // Only execute HIGH confidence trades

  private normalizePair(pair: string): string {
    return pair.toUpperCase().replace(/\s+/g, '').replace(/[\/\-]/g, '/');
  }

  async scanForArbitrageOpportunities(): Promise<ArbitrageOpportunityReal[]> {
    console.log('🔍 Scanning for REAL arbitrage opportunities for LIVE TRADING...');
    
    try {
      const currentPrices = await realTimeMarketDataService.getCurrentPrices();
      console.log(`📊 Found ${currentPrices.length} real price entries from live DEX APIs`);
      
      if (currentPrices.length === 0) {
        console.log('⚠️ No real price data available from DEX APIs');
        return [];
      }

      // Filter out CoinGecko data for arbitrage analysis
      const dexPrices = currentPrices.filter(price => price.dex !== 'CoinGecko');
      console.log(`📊 Using ${dexPrices.length} DEX price entries for REAL arbitrage analysis`);

      const opportunities: ArbitrageOpportunityReal[] = [];

      // Group prices by pair from real DEX data
      const pairGroups = new Map<string, typeof dexPrices>();
      dexPrices.forEach(price => {
        const normalizedPair = this.normalizePair(price.pair);
        if (!pairGroups.has(normalizedPair)) {
          pairGroups.set(normalizedPair, []);
        }
        pairGroups.get(normalizedPair)!.push(price);
      });

      console.log(`🔗 Grouped real DEX prices into ${pairGroups.size} unique pairs for REAL TRADING`);

      // Analyze each pair for real arbitrage opportunities
      for (const [pair, prices] of pairGroups) {
        if (prices.length >= 2) {
          const pairOpportunities = await this.analyzeRealArbitrageForPair(pair, prices);
          opportunities.push(...pairOpportunities);
        }
      }

      // Apply strict filters for REAL trading
      const validOpportunities = opportunities
        .filter(opp => opp.profitPercentage >= this.MIN_PROFIT_PERCENTAGE)
        .filter(opp => opp.volumeAvailable >= this.MIN_VOLUME_ADA)
        .filter(opp => opp.slippageRisk <= this.MAX_SLIPPAGE)
        .filter(opp => opp.netProfit > 5) // Minimum 5 ADA profit for real trades
        .filter(opp => opp.confidence === 'HIGH') // Only HIGH confidence for real trading
        .sort((a, b) => b.netProfit - a.netProfit)
        .slice(0, 10); // Limit to top 10 opportunities for focus

      // Store real opportunities in database
      await this.storeRealOpportunities(validOpportunities);

      console.log(`✅ Found ${validOpportunities.length} REAL TRADING opportunities out of ${opportunities.length} total analyzed`);
      console.log(`🎯 All opportunities are HIGH CONFIDENCE and ready for REAL EXECUTION`);
      
      return validOpportunities;

    } catch (error) {
      console.error('❌ Error scanning for REAL arbitrage opportunities:', error);
      return [];
    }
  }

  private async analyzeRealArbitrageForPair(pair: string, prices: any[]): Promise<ArbitrageOpportunityReal[]> {
    const opportunities: ArbitrageOpportunityReal[] = [];

    // Compare all real price combinations between different DEXs
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const price1 = prices[i];
        const price2 = prices[j];

        // Skip if same DEX
        if (price1.dex === price2.dex) continue;

        // Determine buy and sell DEXs based on real prices
        const [buyPrice, sellPrice, buyDex, sellDex] = 
          price1.price < price2.price 
            ? [price1, price2, price1.dex, price2.dex]
            : [price2, price1, price2.dex, price1.dex];

        // Calculate real profit based on actual price difference
        const priceDiff = sellPrice.price - buyPrice.price;
        const rawProfitPercentage = (priceDiff / buyPrice.price) * 100;

        // Only consider realistic and profitable opportunities for REAL trading
        if (rawProfitPercentage > 1.0 && rawProfitPercentage < 8) {
          // Calculate real fees for these DEXs
          const buyFees = this.calculateRealDEXFees(buyDex, buyPrice.price);
          const sellFees = this.calculateRealDEXFees(sellDex, sellPrice.price);
          const totalFees = buyFees + sellFees;

          // Use conservative volume estimation for REAL trading
          const volumeAvailable = Math.min(
            buyPrice.volume24h * 0.01, // 1% of daily volume (more conservative)
            sellPrice.volume24h * 0.01,
            Math.max(buyPrice.liquidity * 0.0005, 100), // 0.05% of liquidity or min 100 ADA
            Math.max(sellPrice.liquidity * 0.0005, 100),
            500 // Max 500 ADA per opportunity for risk management
          );

          // Calculate realistic net profit
          const grossProfit = priceDiff * volumeAvailable;
          const totalFeesForVolume = totalFees * volumeAvailable;
          const netProfit = grossProfit - totalFeesForVolume;
          const netProfitPercentage = (netProfit / (buyPrice.price * volumeAvailable)) * 100;

          // Calculate realistic liquidity and slippage scores
          const liquidityScore = this.calculateRealLiquidityScore(buyPrice.liquidity, sellPrice.liquidity);
          const slippageRisk = this.calculateRealSlippageRisk(volumeAvailable, liquidityScore);

          // Determine confidence based on real market conditions (stricter for real trading)
          const confidence = this.calculateRealConfidence(
            netProfitPercentage, 
            liquidityScore, 
            slippageRisk,
            priceDiff,
            volumeAvailable
          );

          // Only include HIGH confidence opportunities with significant profit for REAL trading
          if (netProfitPercentage > 1.5 && netProfit > 5 && slippageRisk < 3 && confidence === 'HIGH') {
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
              timeToExpiry: 180, // 3 minutes for real markets
              slippageRisk,
              liquidityScore,
              timestamp: new Date().toISOString(),
              executionReady: true // All opportunities are execution ready for real trading
            });
          }
        }
      }
    }

    return opportunities;
  }

  private calculateRealDEXFees(dexName: string, price: number): number {
    const dexFee = this.DEX_FEES.find(fee => fee.dex === dexName);
    if (!dexFee) return 0.004; // Default 0.4% if DEX not found

    return dexFee.tradingFee + dexFee.withdrawalFee + (dexFee.networkFee / price);
  }

  private calculateRealLiquidityScore(buyLiquidity: number, sellLiquidity: number): number {
    const avgLiquidity = (buyLiquidity + sellLiquidity) / 2;
    
    // More realistic liquidity scoring based on actual Cardano DEX volumes
    if (avgLiquidity > 500000) return 95;
    if (avgLiquidity > 200000) return 85;
    if (avgLiquidity > 100000) return 75;
    if (avgLiquidity > 50000) return 65;
    if (avgLiquidity > 20000) return 55;
    if (avgLiquidity > 10000) return 45;
    return Math.max(30, Math.min(45, (avgLiquidity / 1000) * 3));
  }

  private calculateRealSlippageRisk(volume: number, liquidityScore: number): number {
    // More conservative slippage calculation for real markets
    const liquidityFactor = liquidityScore / 100;
    const baseSlippage = (volume / (liquidityFactor * 50000)) * 100;
    
    // Add market impact based on volume
    const marketImpact = volume > 500 ? (volume - 500) * 0.001 : 0;
    
    return Math.min(10, Math.max(0.2, baseSlippage + marketImpact));
  }

  private calculateRealConfidence(
    profitPercentage: number, 
    liquidityScore: number, 
    slippageRisk: number,
    priceDiff: number,
    volume: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Stricter confidence calculation for real trading
    let score = 0;
    
    // Profit factor (higher profit = higher confidence)
    score += Math.min(40, profitPercentage * 10);
    
    // Liquidity factor
    score += liquidityScore * 0.5;
    
    // Slippage penalty (more severe for real trading)
    score -= slippageRisk * 5;
    
    // Price difference factor (too high might be stale data)
    if (priceDiff / 0.5 > 0.02) score -= 15; // Higher penalty for very high price differences
    
    // Volume factor
    score += Math.min(15, volume / 50);
    
    // For real trading, we're much more conservative
    if (score > 85) return 'HIGH';
    if (score > 70) return 'MEDIUM';
    return 'LOW';
  }

  private async storeRealOpportunities(opportunities: ArbitrageOpportunityReal[]) {
    // Clear old opportunities first
    try {
      await supabase
        .from('arbitrage_opportunities')
        .delete()
        .lt('timestamp', new Date(Date.now() - 300000).toISOString()); // Clear opportunities older than 5 minutes
    } catch (error) {
      console.error('Error clearing old opportunities:', error);
    }

    // Insert new real opportunities
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
            confidence_score: 90, // All stored opportunities are HIGH confidence
            is_active: true,
            timestamp: opp.timestamp
          });
      } catch (error) {
        console.error('Error storing real opportunity:', error);
      }
    }
  }

  // Remove simulation methods since we're doing REAL trading
  async executeRealArbitrageTrade(opportunity: ArbitrageOpportunityReal, walletApi: any): Promise<{
    success: boolean;
    txHash?: string;
    actualProfit?: number;
    error?: string;
  }> {
    console.log(`🚀 EXECUTING REAL ARBITRAGE TRADE for ${opportunity.pair}`);

    try {
      const result = await realTradingService.executeRealArbitrageTrade({
        pair: opportunity.pair,
        buyDex: opportunity.buyDex,
        sellDex: opportunity.sellDex,
        buyPrice: opportunity.buyPrice,
        sellPrice: opportunity.sellPrice,
        amount: opportunity.volumeAvailable,
        walletApi
      });

      return result;

    } catch (error) {
      console.error('❌ Error executing real arbitrage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
