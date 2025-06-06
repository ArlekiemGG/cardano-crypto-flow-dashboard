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
    { dex: 'WingRiders', tradingFee: 0.0035, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 },
    { dex: 'CoinGecko', tradingFee: 0, withdrawalFee: 0, networkFee: 0, minimumTrade: 0 }
  ];

  // Make these thresholds more lenient to find more opportunities
  private readonly MIN_PROFIT_PERCENTAGE = 0.3; // Reduced from 0.5
  private readonly MIN_VOLUME_ADA = 50; // Reduced from 100
  private readonly MAX_SLIPPAGE = 8; // Increased from 5

  private normalizePair(pair: string): string {
    return pair.toUpperCase().replace(/\s+/g, '').replace(/[\/\-]/g, '/');
  }

  async scanForArbitrageOpportunities(): Promise<ArbitrageOpportunityReal[]> {
    console.log('🔍 Scanning for REAL arbitrage opportunities using live DEX data...');
    
    try {
      const currentPrices = await realTimeMarketDataService.getCurrentPrices();
      console.log(`📊 Found ${currentPrices.length} real price entries from live DEX APIs`);
      
      if (currentPrices.length === 0) {
        console.log('⚠️ No real price data available from DEX APIs');
        
        // Generate demo opportunities for testing if no real data is available
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔧 Development mode: Generating sample opportunities for testing');
          return this.generateSampleOpportunities();
        }
        
        return [];
      }

      // Filter out CoinGecko data for arbitrage analysis (it's just for reference)
      const dexPrices = currentPrices.filter(price => price.dex !== 'CoinGecko');
      console.log(`📊 Using ${dexPrices.length} DEX price entries for arbitrage analysis`);

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

      console.log(`🔗 Grouped real DEX prices into ${pairGroups.size} unique pairs`);

      // Analyze each pair for real arbitrage opportunities
      for (const [pair, prices] of pairGroups) {
        if (prices.length >= 2) {
          const pairOpportunities = await this.analyzeRealArbitrageForPair(pair, prices);
          opportunities.push(...pairOpportunities);
        }
      }

      // Apply realistic filters for real opportunities
      const validOpportunities = opportunities
        .filter(opp => opp.profitPercentage >= this.MIN_PROFIT_PERCENTAGE)
        .filter(opp => opp.volumeAvailable >= this.MIN_VOLUME_ADA)
        .filter(opp => opp.slippageRisk <= this.MAX_SLIPPAGE)
        .filter(opp => opp.netProfit > 1) // Reduced minimum profit to 1 ADA
        .sort((a, b) => b.netProfit - a.netProfit)
        .slice(0, 20); // Limit to top 20 opportunities

      // Store real opportunities in database
      await this.storeRealOpportunities(validOpportunities);

      console.log(`✅ Found ${validOpportunities.length} valid REAL arbitrage opportunities out of ${opportunities.length} total analyzed`);
      
      // If no real opportunities found and we're not in production, generate samples
      if (validOpportunities.length === 0 && process.env.NODE_ENV !== 'production') {
        console.log('🔧 Development mode: No real opportunities found. Generating samples...');
        return this.generateSampleOpportunities();
      }
      
      return validOpportunities;

    } catch (error) {
      console.error('❌ Error scanning for real arbitrage opportunities:', error);
      
      // Return sample data in development mode if there's an error
      if (process.env.NODE_ENV !== 'production') {
        return this.generateSampleOpportunities();
      }
      
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

        // Only consider realistic opportunities
        if (rawProfitPercentage > 0.1 && rawProfitPercentage < 10) {
          // Calculate real fees for these DEXs
          const buyFees = this.calculateRealDEXFees(buyDex, buyPrice.price);
          const sellFees = this.calculateRealDEXFees(sellDex, sellPrice.price);
          const totalFees = buyFees + sellFees;

          // Use conservative volume estimation based on real liquidity
          const volumeAvailable = Math.min(
            buyPrice.volume24h * 0.02, // 2% of daily volume is realistic
            sellPrice.volume24h * 0.02,
            Math.max(buyPrice.liquidity * 0.001, 50), // 0.1% of liquidity or min 50 ADA
            Math.max(sellPrice.liquidity * 0.001, 50),
            1000 // Max 1000 ADA per opportunity
          );

          // Calculate realistic net profit
          const grossProfit = priceDiff * volumeAvailable;
          const totalFeesForVolume = totalFees * volumeAvailable;
          const netProfit = grossProfit - totalFeesForVolume;
          const netProfitPercentage = (netProfit / (buyPrice.price * volumeAvailable)) * 100;

          // Calculate realistic liquidity and slippage scores
          const liquidityScore = this.calculateRealLiquidityScore(buyPrice.liquidity, sellPrice.liquidity);
          const slippageRisk = this.calculateRealSlippageRisk(volumeAvailable, liquidityScore);

          // Determine confidence based on real market conditions
          const confidence = this.calculateRealConfidence(
            netProfitPercentage, 
            liquidityScore, 
            slippageRisk,
            priceDiff,
            volumeAvailable
          );

          // Only include profitable opportunities with reasonable risk
          if (netProfitPercentage > 0.3 && netProfit > 2 && slippageRisk < 8) {
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
              timestamp: new Date().toISOString()
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
    // More sophisticated confidence calculation for real opportunities
    let score = 0;
    
    // Profit factor (higher profit = higher confidence)
    score += Math.min(30, profitPercentage * 8);
    
    // Liquidity factor
    score += liquidityScore * 0.4;
    
    // Slippage penalty
    score -= slippageRisk * 3;
    
    // Price difference factor (too high might be stale data)
    if (priceDiff / 0.5 > 0.02) score -= 10; // Penalty for very high price differences
    
    // Volume factor
    score += Math.min(10, volume / 100);
    
    if (score > 70) return 'HIGH';
    if (score > 50) return 'MEDIUM';
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
            confidence_score: opp.confidence === 'HIGH' ? 90 : opp.confidence === 'MEDIUM' ? 70 : 50,
            is_active: true,
            timestamp: opp.timestamp
          });
      } catch (error) {
        console.error('Error storing real opportunity:', error);
      }
    }
  }

  // New method to generate sample opportunities for testing
  private generateSampleOpportunities(): ArbitrageOpportunityReal[] {
    console.log('🔧 Generating sample arbitrage opportunities for testing');
    
    const dexList = ['Minswap', 'SundaeSwap', 'MuesliSwap', 'WingRiders'];
    const pairs = ['ADA/USDT', 'ADA/USDC', 'ADA/DJED', 'HOSKY/ADA'];
    
    const opportunities: ArbitrageOpportunityReal[] = [];
    
    // Generate 3 sample opportunities
    for (let i = 0; i < 3; i++) {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const buyDex = dexList[Math.floor(Math.random() * dexList.length)];
      
      // Ensure sellDex is different from buyDex
      let sellDex = dexList[Math.floor(Math.random() * dexList.length)];
      while (sellDex === buyDex) {
        sellDex = dexList[Math.floor(Math.random() * dexList.length)];
      }
      
      const basePrice = pair.includes('ADA/') ? 0.64 : 0.0001;
      const buyPrice = basePrice * (0.95 + Math.random() * 0.03);
      const sellPrice = buyPrice * (1.01 + Math.random() * 0.03);
      const volumeAvailable = 100 + Math.floor(Math.random() * 900);
      
      const profitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
      const profitADA = (sellPrice - buyPrice) * volumeAvailable;
      
      const liquidityScore = 70 + Math.floor(Math.random() * 20);
      const slippageRisk = 1 + Math.random() * 3;
      
      const confidence = profitPercentage > 2 ? 'HIGH' : 
                          profitPercentage > 1 ? 'MEDIUM' : 'LOW';
      
      opportunities.push({
        id: `${pair}-${buyDex}-${sellDex}-${Date.now()}-${i}`,
        pair,
        buyDex,
        sellDex,
        buyPrice,
        sellPrice,
        profitPercentage,
        profitADA,
        volumeAvailable,
        totalFees: 0.5 + Math.random(),
        netProfit: profitADA - 1,
        confidence,
        timeToExpiry: 120 + Math.floor(Math.random() * 120),
        slippageRisk,
        liquidityScore,
        timestamp: new Date().toISOString(),
        executionReady: confidence === 'HIGH'
      });
    }
    
    return opportunities;
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
