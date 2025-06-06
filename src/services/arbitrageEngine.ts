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

  // Configuración menos restrictiva para capturar más oportunidades
  private readonly MIN_PROFIT_PERCENTAGE = 0.5; // Reducido de 1.5% a 0.5%
  private readonly MIN_VOLUME_ADA = 25; // Reducido de 100 a 25 ADA
  private readonly MAX_SLIPPAGE = 5; // Aumentado de 3% a 5%
  private readonly MIN_CONFIDENCE_FOR_AUTO_TRADES = 'HIGH'; // Solo auto-ejecución HIGH confidence

  private normalizePair(pair: string): string {
    return pair.toUpperCase().replace(/\s+/g, '').replace(/[\/\-]/g, '/');
  }

  async scanForArbitrageOpportunities(): Promise<ArbitrageOpportunityReal[]> {
    console.log('🔍 Scanning for arbitrage opportunities with improved sync settings...');
    
    try {
      const currentPrices = await realTimeMarketDataService.getCurrentPrices();
      console.log(`📊 Found ${currentPrices.length} price entries from live APIs`);
      
      if (currentPrices.length === 0) {
        console.log('⚠️ No price data available from APIs');
        return [];
      }

      // Filter out CoinGecko data for arbitrage analysis but keep other sources
      const dexPrices = currentPrices.filter(price => price.dex !== 'CoinGecko');
      console.log(`📊 Using ${dexPrices.length} DEX price entries for arbitrage analysis`);

      const opportunities: ArbitrageOpportunityReal[] = [];

      // Group prices by pair from DEX data
      const pairGroups = new Map<string, typeof dexPrices>();
      dexPrices.forEach(price => {
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

      // Apply less restrictive filters
      const validOpportunities = opportunities
        .filter(opp => opp.profitPercentage >= this.MIN_PROFIT_PERCENTAGE)
        .filter(opp => opp.volumeAvailable >= this.MIN_VOLUME_ADA)
        .filter(opp => opp.slippageRisk <= this.MAX_SLIPPAGE)
        .filter(opp => opp.netProfit > 2) // Reducido de 5 ADA a 2 ADA
        .filter(opp => opp.confidence === 'HIGH' || opp.confidence === 'MEDIUM') // Incluir MEDIUM confidence
        .sort((a, b) => b.netProfit - a.netProfit)
        .slice(0, 15); // Aumentado de 10 a 15 oportunidades

      // Store opportunities in database
      await this.storeOpportunities(validOpportunities);

      console.log(`✅ Found ${validOpportunities.length} opportunities out of ${opportunities.length} analyzed`);
      console.log(`🎯 Including HIGH and MEDIUM confidence opportunities`);
      
      return validOpportunities;

    } catch (error) {
      console.error('❌ Error scanning for arbitrage opportunities:', error);
      return [];
    }
  }

  private async analyzeArbitrageForPair(pair: string, prices: any[]): Promise<ArbitrageOpportunityReal[]> {
    const opportunities: ArbitrageOpportunityReal[] = [];

    // Compare all price combinations between different DEXs
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const price1 = prices[i];
        const price2 = prices[j];

        // Skip if same DEX
        if (price1.dex === price2.dex) continue;

        // Determine buy and sell DEXs based on prices
        const [buyPrice, sellPrice, buyDex, sellDex] = 
          price1.price < price2.price 
            ? [price1, price2, price1.dex, price2.dex]
            : [price2, price1, price2.dex, price1.dex];

        // Calculate profit based on price difference
        const priceDiff = sellPrice.price - buyPrice.price;
        const rawProfitPercentage = (priceDiff / buyPrice.price) * 100;

        // Consider opportunities with lower thresholds but realistic limits
        if (rawProfitPercentage > 0.3 && rawProfitPercentage < 10) {
          // Calculate fees for these DEXs
          const buyFees = this.calculateDEXFees(buyDex, buyPrice.price);
          const sellFees = this.calculateDEXFees(sellDex, sellPrice.price);
          const totalFees = buyFees + sellFees;

          // Use more flexible volume estimation
          const volumeAvailable = Math.min(
            buyPrice.volume24h * 0.015, // Aumentado de 1% a 1.5%
            sellPrice.volume24h * 0.015,
            Math.max(buyPrice.liquidity * 0.001, 50), // Aumentado factor y reducido mínimo
            Math.max(sellPrice.liquidity * 0.001, 50),
            300 // Reducido de 500 a 300 ADA para permitir más oportunidades
          );

          // Calculate net profit
          const grossProfit = priceDiff * volumeAvailable;
          const totalFeesForVolume = totalFees * volumeAvailable;
          const netProfit = grossProfit - totalFeesForVolume;
          const netProfitPercentage = (netProfit / (buyPrice.price * volumeAvailable)) * 100;

          // Calculate liquidity and slippage scores
          const liquidityScore = this.calculateLiquidityScore(buyPrice.liquidity, sellPrice.liquidity);
          const slippageRisk = this.calculateSlippageRisk(volumeAvailable, liquidityScore);

          // Determine confidence with adjusted thresholds
          const confidence = this.calculateConfidence(
            netProfitPercentage, 
            liquidityScore, 
            slippageRisk,
            priceDiff,
            volumeAvailable
          );

          // Include opportunities with lower thresholds
          if (netProfitPercentage > 0.3 && netProfit > 1 && slippageRisk < 6) {
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
              timeToExpiry: 180, // 3 minutes
              slippageRisk,
              liquidityScore,
              timestamp: new Date().toISOString(),
              executionReady: confidence === 'HIGH' && netProfit > 3 // Solo HIGH confidence con >3 ADA para auto-ejecución
            });
          }
        }
      }
    }

    return opportunities;
  }

  private calculateDEXFees(dexName: string, price: number): number {
    const dexFee = this.DEX_FEES.find(fee => fee.dex === dexName);
    if (!dexFee) return 0.004; // Default 0.4% if DEX not found

    return dexFee.tradingFee + dexFee.withdrawalFee + (dexFee.networkFee / price);
  }

  private calculateLiquidityScore(buyLiquidity: number, sellLiquidity: number): number {
    const avgLiquidity = (buyLiquidity + sellLiquidity) / 2;
    
    // Adjusted liquidity scoring for better detection
    if (avgLiquidity > 300000) return 95;
    if (avgLiquidity > 150000) return 85;
    if (avgLiquidity > 75000) return 75;
    if (avgLiquidity > 35000) return 65;
    if (avgLiquidity > 15000) return 55;
    if (avgLiquidity > 7500) return 45;
    return Math.max(25, Math.min(45, (avgLiquidity / 500) * 2));
  }

  private calculateSlippageRisk(volume: number, liquidityScore: number): number {
    // More flexible slippage calculation
    const liquidityFactor = liquidityScore / 100;
    const baseSlippage = (volume / (liquidityFactor * 40000)) * 100; // Reduced divisor
    
    // Reduced market impact penalty
    const marketImpact = volume > 300 ? (volume - 300) * 0.0008 : 0;
    
    return Math.min(8, Math.max(0.1, baseSlippage + marketImpact));
  }

  private calculateConfidence(
    profitPercentage: number, 
    liquidityScore: number, 
    slippageRisk: number,
    priceDiff: number,
    volume: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Adjusted confidence calculation for more opportunities
    let score = 0;
    
    // Profit factor
    score += Math.min(35, profitPercentage * 8);
    
    // Liquidity factor
    score += liquidityScore * 0.4;
    
    // Slippage penalty (less severe)
    score -= slippageRisk * 3;
    
    // Price difference factor (less restrictive)
    if (priceDiff / 0.5 > 0.03) score -= 10;
    
    // Volume factor
    score += Math.min(12, volume / 30);
    
    // More balanced thresholds
    if (score > 75) return 'HIGH';
    if (score > 55) return 'MEDIUM';
    return 'LOW';
  }

  private async storeOpportunities(opportunities: ArbitrageOpportunityReal[]) {
    // Clear old opportunities first
    try {
      await supabase
        .from('arbitrage_opportunities')
        .delete()
        .lt('timestamp', new Date(Date.now() - 300000).toISOString()); // Clear opportunities older than 5 minutes
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
            confidence_score: opp.confidence === 'HIGH' ? 85 : opp.confidence === 'MEDIUM' ? 70 : 55,
            is_active: true,
            timestamp: opp.timestamp
          });
      } catch (error) {
        console.error('Error storing opportunity:', error);
      }
    }
  }

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
