
import { supabase } from '@/integrations/supabase/client';
import { blockfrostService } from './blockfrostService';

interface DEXPrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  lastUpdate: string;
}

interface ArbitrageOpportunity {
  id: string;
  pair: string;
  dexA: string;
  dexB: string;
  priceA: number;
  priceB: number;
  profitPercentage: number;
  volume: number;
  confidence: 'High' | 'Medium' | 'Low';
  timestamp: string;
}

export class DEXService {
  private dexEndpoints: Record<string, string> = {};

  constructor() {
    this.initializeDEXEndpoints();
  }

  private async initializeDEXEndpoints() {
    try {
      const { data: dexConfigs } = await supabase
        .from('dex_configs')
        .select('dex_name, api_endpoint, config_json')
        .eq('active', true);

      if (dexConfigs) {
        dexConfigs.forEach(config => {
          this.dexEndpoints[config.dex_name] = config.api_endpoint;
        });
      }
    } catch (error) {
      console.error('Error initializing DEX endpoints:', error);
    }
  }

  async getMinswapPrices(): Promise<DEXPrice[]> {
    try {
      // Simulated Minswap API call - replace with actual API when available
      console.log('Fetching Minswap prices...');
      const adaPrice = await blockfrostService.getADAPrice();
      
      return [
        {
          dex: 'Minswap',
          pair: 'ADA/USDC',
          price: adaPrice,
          volume24h: Math.random() * 1000000 + 500000,
          lastUpdate: new Date().toISOString()
        },
        {
          dex: 'Minswap',
          pair: 'ADA/BTC',
          price: adaPrice / 45000, // Rough BTC conversion
          volume24h: Math.random() * 500000 + 200000,
          lastUpdate: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching Minswap prices:', error);
      return [];
    }
  }

  async getSundaeSwapPrices(): Promise<DEXPrice[]> {
    try {
      console.log('Fetching SundaeSwap prices...');
      const adaPrice = await blockfrostService.getADAPrice();
      
      return [
        {
          dex: 'SundaeSwap',
          pair: 'ADA/USDC',
          price: adaPrice * (0.998 + Math.random() * 0.004), // Slight price variation
          volume24h: Math.random() * 800000 + 400000,
          lastUpdate: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching SundaeSwap prices:', error);
      return [];
    }
  }

  async getMuesliSwapPrices(): Promise<DEXPrice[]> {
    try {
      console.log('Fetching MuesliSwap prices...');
      const adaPrice = await blockfrostService.getADAPrice();
      
      return [
        {
          dex: 'MuesliSwap',
          pair: 'ADA/USDC',
          price: adaPrice * (0.997 + Math.random() * 0.006),
          volume24h: Math.random() * 600000 + 300000,
          lastUpdate: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching MuesliSwap prices:', error);
      return [];
    }
  }

  async getAllDEXPrices(): Promise<DEXPrice[]> {
    try {
      const [minswap, sundae, muesli] = await Promise.allSettled([
        this.getMinswapPrices(),
        this.getSundaeSwapPrices(),
        this.getMuesliSwapPrices()
      ]);

      const allPrices: DEXPrice[] = [];
      
      if (minswap.status === 'fulfilled') allPrices.push(...minswap.value);
      if (sundae.status === 'fulfilled') allPrices.push(...sundae.value);
      if (muesli.status === 'fulfilled') allPrices.push(...muesli.value);

      return allPrices;
    } catch (error) {
      console.error('Error fetching all DEX prices:', error);
      return [];
    }
  }

  async detectArbitrageOpportunities(prices: DEXPrice[]): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    const pairGroups: Record<string, DEXPrice[]> = {};

    // Group prices by pair
    prices.forEach(price => {
      if (!pairGroups[price.pair]) {
        pairGroups[price.pair] = [];
      }
      pairGroups[price.pair].push(price);
    });

    // Find arbitrage opportunities
    Object.entries(pairGroups).forEach(([pair, pairPrices]) => {
      if (pairPrices.length < 2) return;

      for (let i = 0; i < pairPrices.length; i++) {
        for (let j = i + 1; j < pairPrices.length; j++) {
          const priceA = pairPrices[i];
          const priceB = pairPrices[j];
          
          const priceDiff = Math.abs(priceA.price - priceB.price);
          const avgPrice = (priceA.price + priceB.price) / 2;
          const profitPercentage = (priceDiff / avgPrice) * 100;

          if (profitPercentage > 0.1) { // Minimum 0.1% profit threshold
            opportunities.push({
              id: `${priceA.dex}-${priceB.dex}-${pair}-${Date.now()}`,
              pair,
              dexA: priceA.dex,
              dexB: priceB.dex,
              priceA: priceA.price,
              priceB: priceB.price,
              profitPercentage,
              volume: Math.min(priceA.volume24h, priceB.volume24h),
              confidence: profitPercentage > 1 ? 'High' : profitPercentage > 0.5 ? 'Medium' : 'Low',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });

    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  async updateMarketDataCache(prices: DEXPrice[]): Promise<void> {
    try {
      for (const price of prices) {
        await supabase
          .from('market_data_cache')
          .upsert({
            pair: price.pair,
            price: price.price,
            volume_24h: price.volume24h,
            source_dex: price.dex,
            timestamp: new Date().toISOString(),
            change_24h: (Math.random() - 0.5) * 10, // Simulated change
            high_24h: price.price * (1 + Math.random() * 0.05),
            low_24h: price.price * (1 - Math.random() * 0.05)
          }, {
            onConflict: 'pair,source_dex'
          });
      }
    } catch (error) {
      console.error('Error updating market data cache:', error);
    }
  }

  async saveArbitrageOpportunities(opportunities: ArbitrageOpportunity[]): Promise<void> {
    try {
      for (const opp of opportunities) {
        await supabase
          .from('arbitrage_opportunities')
          .insert({
            dex_pair: opp.pair,
            price_diff: Math.abs(opp.priceA - opp.priceB),
            profit_potential: opp.profitPercentage,
            source_dex_a: opp.dexA,
            source_dex_b: opp.dexB,
            price_a: opp.priceA,
            price_b: opp.priceB,
            volume_available: opp.volume,
            confidence_score: opp.confidence === 'High' ? 90 : opp.confidence === 'Medium' ? 70 : 50,
            is_active: true
          });
      }
    } catch (error) {
      console.error('Error saving arbitrage opportunities:', error);
    }
  }
}

export const dexService = new DEXService();
