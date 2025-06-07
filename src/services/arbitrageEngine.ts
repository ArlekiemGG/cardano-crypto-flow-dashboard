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

interface ExtendedMarketData {
  pair: string;
  dex: string;
  price: number;
  volume24h: number;
  liquidity: number;
}

export class ArbitrageEngine {
  private readonly DEX_FEES: DEXFeeStructure[] = [
    { dex: 'Minswap', tradingFee: 0.003, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 },
    { dex: 'SundaeSwap', tradingFee: 0.003, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 5 },
    { dex: 'MuesliSwap', tradingFee: 0.0025, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 5 },
    { dex: 'WingRiders', tradingFee: 0.0035, withdrawalFee: 0.001, networkFee: 0.17, minimumTrade: 10 },
    { dex: 'DeFiLlama', tradingFee: 0.002, withdrawalFee: 0.0005, networkFee: 0.17, minimumTrade: 5 }
  ];

  // More realistic thresholds for better opportunity detection
  private readonly MIN_PROFIT_PERCENTAGE = 0.8;
  private readonly MIN_VOLUME_ADA = 50;
  private readonly MAX_SLIPPAGE = 4;
  private readonly MIN_CONFIDENCE_FOR_AUTO_TRADES = 'HIGH';
  private readonly MIN_PRICE_DIFFERENCE = 0.001; // Minimum price difference in USD

  private lastScanTime = 0;
  private readonly SCAN_COOLDOWN = 45000; // 45 seconds between scans
  private isScanning = false;

  private normalizePair(pair: string): string {
    return pair.toUpperCase().replace(/\s+/g, '').replace(/[\/\-]/g, '/');
  }

  async scanForArbitrageOpportunities(): Promise<ArbitrageOpportunityReal[]> {
    // Prevent concurrent scans and respect cooldown
    if (this.isScanning || !this.canScan()) {
      console.log('⏳ Skipping arbitrage scan due to cooldown or concurrent scan');
      return [];
    }

    this.isScanning = true;
    this.lastScanTime = Date.now();
    
    console.log('🔍 Starting optimized arbitrage scan...');
    
    try {
      const currentPrices = await realTimeMarketDataService.getCurrentPrices();
      console.log(`📊 Analyzing ${currentPrices.length} price entries`);
      
      if (currentPrices.length < 2) {
        console.log('⚠️ Insufficient price data for arbitrage analysis');
        return [];
      }

      // Filter and prepare data for analysis
      const validPrices: ExtendedMarketData[] = currentPrices
        .filter(price => this.isValidPriceEntry(price))
        .map(price => ({
          pair: `${price.symbol}/USD`,
          dex: price.source || 'Unknown',
          price: price.price,
          volume24h: Math.max(price.volume24h, 1000), // Ensure minimum volume
          liquidity: Math.max(price.volume24h * 0.15, 1000) // Improved liquidity estimation
        }));

      console.log(`📊 Using ${validPrices.length} valid entries for analysis`);

      if (validPrices.length < 2) {
        console.log('⚠️ Not enough valid price entries for arbitrage');
        return [];
      }

      const opportunities: ArbitrageOpportunityReal[] = [];

      // Group by trading pairs
      const pairGroups = this.groupPricesByPair(validPrices);
      console.log(`🔗 Analyzing ${pairGroups.size} unique pairs`);

      // Analyze each pair for arbitrage opportunities
      for (const [pair, prices] of pairGroups) {
        if (prices.length >= 2) {
          const pairOpportunities = await this.analyzeArbitrageForPair(pair, prices);
          opportunities.push(...pairOpportunities);
        }
      }

      // Apply improved filtering and ranking
      const validOpportunities = this.filterAndRankOpportunities(opportunities);

      // Store opportunities in database
      await this.storeOpportunities(validOpportunities);

      console.log(`✅ Found ${validOpportunities.length} valid opportunities from ${opportunities.length} analyzed`);
      
      return validOpportunities;

    } catch (error) {
      console.error('❌ Error in arbitrage scan:', error);
      return [];
    } finally {
      this.isScanning = false;
    }
  }

  private async storeOpportunities(opportunities: ArbitrageOpportunityReal[]): Promise<void> {
    if (opportunities.length === 0) return;

    try {
      // Clean up old opportunities first
      await supabase
        .from('arbitrage_opportunities')
        .delete()
        .lt('timestamp', new Date(Date.now() - 3600000).toISOString()); // Remove older than 1 hour

      // Insert new opportunities with correct field mapping
      const opportunitiesData = opportunities.map(opp => ({
        dex_pair: opp.pair,
        source_dex_a: opp.buyDex,
        source_dex_b: opp.sellDex,
        price_a: opp.buyPrice,
        price_b: opp.sellPrice,
        price_diff: opp.sellPrice - opp.buyPrice,
        profit_potential: opp.profitPercentage,
        volume_available: opp.volumeAvailable,
        confidence_score: opp.confidence === 'HIGH' ? 90 : opp.confidence === 'MEDIUM' ? 70 : 50,
        expires_at: new Date(Date.now() + (opp.timeToExpiry * 1000)).toISOString(),
        timestamp: opp.timestamp,
        is_active: true
      }));

      const { error } = await supabase
        .from('arbitrage_opportunities')
        .insert(opportunitiesData);

      if (error) {
        console.error('Error storing arbitrage opportunities:', error);
      } else {
        console.log(`✅ Stored ${opportunities.length} arbitrage opportunities`);
      }
    } catch (error) {
      console.error('Error in storeOpportunities:', error);
    }
  }

  private canScan(): boolean {
    return Date.now() - this.lastScanTime >= this.SCAN_COOLDOWN;
  }

  private isValidPriceEntry(price: any): boolean {
    return price.price > 0.001 && 
           price.price < 100 && 
           price.volume24h > 0 &&
           price.source !== 'CoinGecko' && // Exclude reference prices
           price.symbol && 
           price.symbol !== 'UNKNOWN';
  }

  private groupPricesByPair(prices: ExtendedMarketData[]): Map<string, ExtendedMarketData[]> {
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

  private async analyzeArbitrageForPair(pair: string, prices: ExtendedMarketData[]): Promise<ArbitrageOpportunityReal[]> {
    const opportunities: ArbitrageOpportunityReal[] = [];

    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const price1 = prices[i];
        const price2 = prices[j];

        if (price1.dex === price2.dex) continue;

        const priceDiff = Math.abs(price1.price - price2.price);
        
        // Skip if price difference is too small
        if (priceDiff < this.MIN_PRICE_DIFFERENCE) continue;

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
      const buyFees = this.calculateDEXFees(buyDex, buyPrice.price);
      const sellFees = this.calculateDEXFees(sellDex, sellPrice.price);
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

      const liquidityScore = this.calculateLiquidityScore(buyPrice.liquidity, sellPrice.liquidity);
      const slippageRisk = this.calculateSlippageRisk(volumeAvailable, liquidityScore);
      const confidence = this.calculateConfidence(
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
    return opportunity.profitPercentage >= this.MIN_PROFIT_PERCENTAGE &&
           opportunity.volumeAvailable >= this.MIN_VOLUME_ADA &&
           opportunity.slippageRisk <= this.MAX_SLIPPAGE &&
           opportunity.netProfit > 2 &&
           opportunity.confidence !== 'LOW';
  }

  private filterAndRankOpportunities(opportunities: ArbitrageOpportunityReal[]): ArbitrageOpportunityReal[] {
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
