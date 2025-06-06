
import { supabase } from '@/integrations/supabase/client';
import { CacheManager } from './CacheManager';
import { DeFiLlamaAPIClient } from './DeFiLlamaAPIClient';
import { DeFiLlamaProtocol, DeFiLlamaPriceResponse } from './types';

class OptimizedDataService {
  private cacheManager: CacheManager;
  private apiClient: DeFiLlamaAPIClient;
  private isConnected: boolean = false;

  constructor() {
    this.cacheManager = new CacheManager(5 * 60 * 1000); // 5 minutes TTL
    this.apiClient = new DeFiLlamaAPIClient();
    
    // Auto-clean cache every 10 minutes
    setInterval(() => {
      this.cacheManager.clearExpiredCache();
    }, 10 * 60 * 1000);
  }

  // 🎯 Get current prices with cache and fallback
  async getCurrentPrices(tokens: string[]): Promise<DeFiLlamaPriceResponse> {
    const tokensString = tokens.join(',');
    const cacheKey = `prices:${tokensString}`;
    
    // Check cache
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for prices: ${tokensString}`);
      return cached.data;
    }

    try {
      // Try DeFiLlama first
      console.log(`📊 Fetching prices from DeFiLlama: ${tokensString}`);
      const data = await this.apiClient.getCurrentPrices(tokens);

      // Fix: Properly handle different API response formats
      let priceResponse: DeFiLlamaPriceResponse;
      
      if (data && typeof data === 'object') {
        // Check if it's already in the expected format with coins property
        if ('coins' in data && typeof data.coins === 'object') {
          priceResponse = data as DeFiLlamaPriceResponse;
        } else {
          // If it's a direct price object, wrap it properly
          priceResponse = {
            coins: data as Record<string, any>
          };
        }
      } else {
        // Fallback to empty structure
        priceResponse = {
          coins: {}
        };
      }

      // Save to cache
      this.cacheManager.set(cacheKey, priceResponse, 'defillama');
      console.log(`✅ DeFiLlama prices cached: ${Object.keys(priceResponse.coins).length} tokens`);
      this.isConnected = true;
      return priceResponse;

    } catch (error) {
      console.error('❌ DeFiLlama prices error:', error);
      this.isConnected = false;
      
      // Fallback to native API
      const fallbackData = await this.fallbackToNativeAPI('prices', { tokens });
      this.cacheManager.set(cacheKey, fallbackData, 'native');
      return fallbackData;
    }
  }

  // 📈 Get Cardano DEX volumes
  async getCardanoDexVolumes(): Promise<any> {
    const cacheKey = 'cardano-dex-volumes';
    
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for Cardano DEX volumes');
      return cached.data;
    }

    try {
      console.log('📊 Fetching Cardano DEX volumes from DeFiLlama...');
      const data = await this.apiClient.getCardanoDexVolumes();

      this.cacheManager.set(cacheKey, data, 'defillama');
      console.log(`✅ Cardano DEX volumes cached: ${data.protocols?.length || 0} protocols`);
      this.isConnected = true;
      return data;

    } catch (error) {
      console.error('❌ DeFiLlama DEX volumes error:', error);
      this.isConnected = false;
      
      const fallbackData = await this.fallbackToNativeAPI('dex-volumes');
      this.cacheManager.set(cacheKey, fallbackData, 'native');
      return fallbackData;
    }
  }

  // 🏦 Get Cardano protocols
  async getCardanoProtocols(): Promise<DeFiLlamaProtocol[]> {
    const cacheKey = 'cardano-protocols';
    
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for Cardano protocols');
      return cached.data;
    }

    try {
      console.log('📊 Fetching Cardano protocols from DeFiLlama...');
      const allProtocols = await this.apiClient.getAllProtocols();

      // Filter only Cardano protocols
      const cardanoProtocols = allProtocols.filter(protocol => 
        protocol.chains?.includes('Cardano') && protocol.tvl > 100000
      );

      this.cacheManager.set(cacheKey, cardanoProtocols, 'defillama');
      console.log(`✅ Cardano protocols cached: ${cardanoProtocols.length} protocols`);
      this.isConnected = true;
      return cardanoProtocols;

    } catch (error) {
      console.error('❌ DeFiLlama protocols error:', error);
      this.isConnected = false;
      
      const fallbackData = await this.fallbackToNativeAPI('protocols');
      this.cacheManager.set(cacheKey, fallbackData || [], 'native');
      return fallbackData || [];
    }
  }

  // 📊 Get historical prices
  async getHistoricalPrices(tokens: string[], timestamp: number): Promise<any> {
    const tokensString = tokens.join(',');
    const cacheKey = `historical-prices:${tokensString}:${timestamp}`;
    
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for historical prices: ${tokensString}`);
      return cached.data;
    }

    try {
      console.log(`📊 Fetching historical prices from DeFiLlama: ${tokensString} at ${timestamp}`);
      const data = await this.apiClient.getHistoricalPrices(tokens, timestamp);

      this.cacheManager.set(cacheKey, data, 'defillama');
      return data;

    } catch (error) {
      console.error('❌ DeFiLlama historical prices error:', error);
      const fallbackData = await this.fallbackToNativeAPI('historical-prices', { tokens, timestamp });
      
      this.cacheManager.set(cacheKey, fallbackData, 'native');
      return fallbackData;
    }
  }

  // 🔍 Fallback to native API
  private async fallbackToNativeAPI(dataType: string, params?: any): Promise<any> {
    console.warn(`⚠️ Fallback to native API for: ${dataType}`);
    
    try {
      // Use edge function as fallback
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all', fallback: true })
      });

      if (error) throw error;
      
      // Transform the fallback data to match expected structure
      if (dataType === 'prices') {
        return {
          coins: data || {}
        };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Fallback failed:', error);
      
      // Return empty structure for prices to prevent further errors
      if (dataType === 'prices') {
        return { coins: {} };
      }
      
      throw new Error(`Fallback failed for ${dataType}: ${error}`);
    }
  }

  // 📈 Get cache statistics
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  // 🔄 Refresh critical data
  async refreshCriticalData(): Promise<void> {
    console.log('🔄 Refreshing critical data...');
    
    const criticalTokens = ['coingecko:cardano'];
    
    await Promise.allSettled([
      this.getCurrentPrices(criticalTokens),
      this.getCardanoDexVolumes(),
      this.getCardanoProtocols()
    ]);
    
    console.log('✅ Critical data refresh completed');
  }
  
  // 🔌 Get connection status
  isApiConnected(): boolean {
    return this.isConnected;
  }
}

export const optimizedDataService = new OptimizedDataService();
