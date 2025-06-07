
import { supabase } from '@/integrations/supabase/client';
import { realTimeMarketDataService } from './realTimeMarketDataService';
import { realTradingService } from './realTradingService';
import { ArbitrageOpportunityReal } from './arbitrage/types';
import { opportunityValidationService } from './arbitrage/opportunityValidationService';
import { opportunityAnalysisService } from './arbitrage/opportunityAnalysisService';
import { databaseOperationsService } from './arbitrage/databaseOperationsService';
import { feeCalculationService } from './arbitrage/feeCalculationService';

export class ArbitrageEngine {
  private readonly SCAN_COOLDOWN = 45000; // 45 seconds between scans
  private lastScanTime = 0;
  private isScanning = false;

  private canScan(): boolean {
    return Date.now() - this.lastScanTime >= this.SCAN_COOLDOWN;
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
      const validPrices = opportunityValidationService.prepareMarketData(currentPrices);
      console.log(`📊 Using ${validPrices.length} valid entries for analysis`);

      if (validPrices.length < 2) {
        console.log('⚠️ Not enough valid price entries for arbitrage');
        return [];
      }

      const opportunities: ArbitrageOpportunityReal[] = [];

      // Group by trading pairs
      const pairGroups = opportunityAnalysisService.groupPricesByPair(validPrices);
      console.log(`🔗 Analyzing ${pairGroups.size} unique pairs`);

      // Analyze each pair for arbitrage opportunities
      for (const [pair, prices] of pairGroups) {
        if (prices.length >= 2) {
          const pairOpportunities = await opportunityAnalysisService.analyzeArbitrageForPair(pair, prices);
          opportunities.push(...pairOpportunities);
        }
      }

      // Apply improved filtering and ranking
      const validOpportunities = opportunityAnalysisService.filterAndRankOpportunities(opportunities);

      // Store opportunities in database
      await databaseOperationsService.storeOpportunities(validOpportunities);

      console.log(`✅ Found ${validOpportunities.length} valid opportunities from ${opportunities.length} analyzed`);
      
      return validOpportunities;

    } catch (error) {
      console.error('❌ Error in arbitrage scan:', error);
      return [];
    } finally {
      this.isScanning = false;
    }
  }

  // Delegate calculation methods to feeCalculationService
  calculateDEXFees(dexName: string, price: number): number {
    return feeCalculationService.calculateDEXFees(dexName, price);
  }

  calculateLiquidityScore(buyLiquidity: number, sellLiquidity: number): number {
    return feeCalculationService.calculateLiquidityScore(buyLiquidity, sellLiquidity);
  }

  calculateSlippageRisk(volume: number, liquidityScore: number): number {
    return feeCalculationService.calculateSlippageRisk(volume, liquidityScore);
  }

  calculateConfidence(
    profitPercentage: number, 
    liquidityScore: number, 
    slippageRisk: number,
    priceDiff: number,
    volume: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    return feeCalculationService.calculateConfidence(
      profitPercentage, 
      liquidityScore, 
      slippageRisk, 
      priceDiff, 
      volume
    );
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
    return databaseOperationsService.getArbitragePerformance(days);
  }
}

export const arbitrageEngine = new ArbitrageEngine();
