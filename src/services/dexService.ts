
import { supabase } from '@/integrations/supabase/client';

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
  async updateMarketData(): Promise<void> {
    try {
      console.log('Calling DEX data fetch edge function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('Error calling fetch-dex-data function:', error);
        throw error;
      }

      console.log('DEX data fetch completed:', data);
    } catch (error) {
      console.error('Error updating market data:', error);
      throw error;
    }
  }

  async getAllDEXPrices(): Promise<DEXPrice[]> {
    try {
      const { data: cachedData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching cached prices:', error);
        return [];
      }

      return cachedData?.map(item => ({
        dex: item.source_dex,
        pair: item.pair,
        price: Number(item.price),
        volume24h: Number(item.volume_24h) || 0,
        lastUpdate: item.timestamp || new Date().toISOString()
      })) || [];
    } catch (error) {
      console.error('Error getting DEX prices:', error);
      return [];
    }
  }

  async detectRealArbitrage(): Promise<ArbitrageOpportunity[]> {
    try {
      const { data: arbitrageData, error } = await supabase
        .from('arbitrage_opportunities')
        .select('*')
        .eq('is_active', true)
        .order('profit_potential', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching arbitrage opportunities:', error);
        return [];
      }

      return arbitrageData?.map(item => ({
        id: item.id,
        pair: item.dex_pair,
        dexA: item.source_dex_a,
        dexB: item.source_dex_b,
        priceA: Number(item.price_a),
        priceB: Number(item.price_b),
        profitPercentage: Number(item.profit_potential),
        volume: Number(item.volume_available) || 0,
        confidence: item.confidence_score >= 80 ? 'High' : item.confidence_score >= 60 ? 'Medium' : 'Low',
        timestamp: item.timestamp || new Date().toISOString()
      })) || [];
    } catch (error) {
      console.error('Error detecting arbitrage:', error);
      return [];
    }
  }

  async getRealVolumes(): Promise<{ dex: string; totalVolume: number }[]> {
    try {
      const { data: volumeData, error } = await supabase
        .from('market_data_cache')
        .select('source_dex, volume_24h')
        .not('volume_24h', 'is', null);

      if (error) {
        console.error('Error fetching volume data:', error);
        return [];
      }

      const volumesByDex: Record<string, number> = {};
      
      volumeData?.forEach(item => {
        const dex = item.source_dex;
        const volume = Number(item.volume_24h) || 0;
        volumesByDex[dex] = (volumesByDex[dex] || 0) + volume;
      });

      return Object.entries(volumesByDex)
        .map(([dex, totalVolume]) => ({ dex, totalVolume }))
        .sort((a, b) => b.totalVolume - a.totalVolume);
    } catch (error) {
      console.error('Error getting real volumes:', error);
      return [];
    }
  }

  // Legacy method aliases for backward compatibility
  async detectArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
    return await this.detectRealArbitrage();
  }

  // Individual DEX price methods now use cached data
  async getMinswapPrices(): Promise<DEXPrice[]> {
    const allPrices = await this.getAllDEXPrices();
    return allPrices.filter(price => price.dex === 'Minswap');
  }

  async getSundaeSwapPrices(): Promise<DEXPrice[]> {
    const allPrices = await this.getAllDEXPrices();
    return allPrices.filter(price => price.dex === 'SundaeSwap');
  }

  async getMuesliSwapPrices(): Promise<DEXPrice[]> {
    const allPrices = await this.getAllDEXPrices();
    return allPrices.filter(price => price.dex === 'MuesliSwap');
  }

  async getWingRidersPrices(): Promise<DEXPrice[]> {
    const allPrices = await this.getAllDEXPrices();
    return allPrices.filter(price => price.dex === 'WingRiders');
  }
}

export const dexService = new DEXService();
