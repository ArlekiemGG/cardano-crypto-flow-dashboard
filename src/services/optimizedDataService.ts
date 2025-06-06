
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  data: any;
  timestamp: number;
  source: 'defillama' | 'native';
}

interface DeFiLlamaPrice {
  coins: Record<string, {
    price: number;
    symbol: string;
    timestamp: number;
    confidence: number;
  }>;
}

interface DeFiLlamaProtocol {
  id: string;
  name: string;
  chains: string[];
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  volume_1d?: number;
}

class OptimizedDataService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly DEFILLAMA_BASE_URL = 'https://api.llama.fi';
  private readonly COINS_API_URL = 'https://coins.llama.fi';

  // Endpoints clave de DeFiLlama
  private readonly ENDPOINTS = {
    // Precios actuales
    currentPrices: (tokens: string) => `${this.COINS_API_URL}/prices/current/${tokens}`,
    
    // Precios históricos
    historicalPrices: (tokens: string, timestamp: number) => 
      `${this.COINS_API_URL}/prices/historical/${timestamp}/${tokens}`,
    
    // Protocolos y TVL
    protocols: () => `${this.DEFILLAMA_BASE_URL}/protocols`,
    protocolTVL: (protocol: string) => `${this.DEFILLAMA_BASE_URL}/tvl/${protocol}`,
    
    // Volúmenes de DEX
    dexVolumes: () => `${this.DEFILLAMA_BASE_URL}/overview/dexs`,
    dexVolumesByChain: (chain: string) => `${this.DEFILLAMA_BASE_URL}/overview/dexs/${chain}`,
    
    // Datos específicos de Cardano
    cardanoTVL: () => `${this.DEFILLAMA_BASE_URL}/tvl/cardano`,
    cardanoDexes: () => `${this.DEFILLAMA_BASE_URL}/overview/dexs/cardano`
  };

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `defillama:${endpoint}:${paramString}`;
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  private async fetchWithRetry(url: string, retries = 2): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Cardano-DEX-Monitor/1.0'
          }
        });
        
        if (response.ok) return response;
        
        if (i === retries) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        // Esperar antes del retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } catch (error) {
        if (i === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async fallbackToNativeAPI(dataType: string, params?: any): Promise<any> {
    console.warn(`⚠️ Fallback a API nativa para: ${dataType}`);
    
    try {
      // Usar edge function como fallback
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all', fallback: true })
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Fallback failed:', error);
      throw new Error(`Fallback failed for ${dataType}: ${error}`);
    }
  }

  // 🎯 Método principal: Obtener precios con caché y fallback
  async getCurrentPrices(tokens: string[]): Promise<any> {
    const tokensString = tokens.join(',');
    const cacheKey = this.getCacheKey('prices', { tokens: tokensString });
    
    // Verificar caché
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached)) {
      console.log(`✅ Cache hit para precios: ${tokensString}`);
      return cached.data;
    }

    try {
      // Intentar DeFiLlama primero
      console.log(`📊 Fetching prices from DeFiLlama: ${tokensString}`);
      const response = await this.fetchWithRetry(this.ENDPOINTS.currentPrices(tokensString));
      const data: DeFiLlamaPrice = await response.json();

      // Guardar en caché
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        source: 'defillama'
      });

      console.log(`✅ DeFiLlama prices cached: ${Object.keys(data.coins || {}).length} tokens`);
      return data;

    } catch (error) {
      console.error('❌ DeFiLlama prices error:', error);
      
      // Fallback a API nativa
      const fallbackData = await this.fallbackToNativeAPI('prices', { tokens });
      
      // Guardar fallback en caché con TTL menor
      this.cache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now(),
        source: 'native'
      });

      return fallbackData;
    }
  }

  // 📈 Obtener volúmenes de DEXs de Cardano
  async getCardanoDexVolumes(): Promise<any> {
    const cacheKey = this.getCacheKey('cardano-dex-volumes');
    
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached)) {
      console.log('✅ Cache hit para volúmenes de DEX Cardano');
      return cached.data;
    }

    try {
      console.log('📊 Fetching Cardano DEX volumes from DeFiLlama...');
      const response = await this.fetchWithRetry(this.ENDPOINTS.cardanoDexes());
      const data = await response.json();

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        source: 'defillama'
      });

      console.log(`✅ Cardano DEX volumes cached: ${data.protocols?.length || 0} protocols`);
      return data;

    } catch (error) {
      console.error('❌ DeFiLlama DEX volumes error:', error);
      const fallbackData = await this.fallbackToNativeAPI('dex-volumes');
      
      this.cache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now(),
        source: 'native'
      });

      return fallbackData;
    }
  }

  // 🏦 Obtener protocolos DeFi de Cardano
  async getCardanoProtocols(): Promise<DeFiLlamaProtocol[]> {
    const cacheKey = this.getCacheKey('cardano-protocols');
    
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached)) {
      console.log('✅ Cache hit para protocolos Cardano');
      return cached.data;
    }

    try {
      console.log('📊 Fetching Cardano protocols from DeFiLlama...');
      const response = await this.fetchWithRetry(this.ENDPOINTS.protocols());
      const allProtocols: DeFiLlamaProtocol[] = await response.json();

      // Filtrar solo protocolos de Cardano
      const cardanoProtocols = allProtocols.filter(protocol => 
        protocol.chains?.includes('Cardano') && protocol.tvl > 100000
      );

      this.cache.set(cacheKey, {
        data: cardanoProtocols,
        timestamp: Date.now(),
        source: 'defillama'
      });

      console.log(`✅ Cardano protocols cached: ${cardanoProtocols.length} protocols`);
      return cardanoProtocols;

    } catch (error) {
      console.error('❌ DeFiLlama protocols error:', error);
      const fallbackData = await this.fallbackToNativeAPI('protocols');
      
      this.cache.set(cacheKey, {
        data: fallbackData || [],
        timestamp: Date.now(),
        source: 'native'
      });

      return fallbackData || [];
    }
  }

  // 📊 Obtener datos históricos de precios
  async getHistoricalPrices(tokens: string[], timestamp: number): Promise<any> {
    const tokensString = tokens.join(',');
    const cacheKey = this.getCacheKey('historical-prices', { tokens: tokensString, timestamp });
    
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached)) {
      console.log(`✅ Cache hit para precios históricos: ${tokensString}`);
      return cached.data;
    }

    try {
      console.log(`📊 Fetching historical prices from DeFiLlama: ${tokensString} at ${timestamp}`);
      const response = await this.fetchWithRetry(
        this.ENDPOINTS.historicalPrices(tokensString, timestamp)
      );
      const data = await response.json();

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        source: 'defillama'
      });

      return data;

    } catch (error) {
      console.error('❌ DeFiLlama historical prices error:', error);
      const fallbackData = await this.fallbackToNativeAPI('historical-prices', { tokens, timestamp });
      
      this.cache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now(),
        source: 'native'
      });

      return fallbackData;
    }
  }

  // 🧹 Limpiar caché expirado
  clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
  }

  // 📈 Métricas de caché
  getCacheStats() {
    const total = this.cache.size;
    const valid = Array.from(this.cache.values()).filter(entry => this.isValidCache(entry)).length;
    const sources = Array.from(this.cache.values()).reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      valid,
      expired: total - valid,
      sources,
      hitRate: valid / total
    };
  }

  // 🔄 Refrescar datos críticos
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
}

export const optimizedDataService = new OptimizedDataService();

// Auto-limpiar caché cada 10 minutos
setInterval(() => {
  optimizedDataService.clearExpiredCache();
}, 10 * 60 * 1000);
