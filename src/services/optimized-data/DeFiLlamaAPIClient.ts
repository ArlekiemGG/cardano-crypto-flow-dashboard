
import { DeFiLlamaProtocol, DeFiLlamaPrice } from './types';

export class DeFiLlamaAPIClient {
  private readonly DEFILLAMA_BASE_URL = 'https://api.llama.fi';
  private readonly COINS_API_URL = 'https://coins.llama.fi';

  // Define endpoints
  private readonly ENDPOINTS = {
    // Current prices
    currentPrices: (tokens: string) => `${this.COINS_API_URL}/prices/current/${tokens}`,
    
    // Historical prices
    historicalPrices: (tokens: string, timestamp: number) => 
      `${this.COINS_API_URL}/prices/historical/${timestamp}/${tokens}`,
    
    // Protocols and TVL
    protocols: () => `${this.DEFILLAMA_BASE_URL}/protocols`,
    protocolTVL: (protocol: string) => `${this.DEFILLAMA_BASE_URL}/tvl/${protocol}`,
    
    // DEX volumes
    dexVolumes: () => `${this.DEFILLAMA_BASE_URL}/overview/dexs`,
    dexVolumesByChain: (chain: string) => `${this.DEFILLAMA_BASE_URL}/overview/dexs/${chain}`,
    
    // Cardano specific data
    cardanoTVL: () => `${this.DEFILLAMA_BASE_URL}/tvl/cardano`,
    cardanoDexes: () => `${this.DEFILLAMA_BASE_URL}/overview/dexs/cardano`
  };

  // Helper method for fetch with retry
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
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } catch (error) {
        if (i === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Get current prices
  async getCurrentPrices(tokens: string[]): Promise<DeFiLlamaPrice> {
    const tokensString = tokens.join(',');
    const response = await this.fetchWithRetry(this.ENDPOINTS.currentPrices(tokensString));
    return await response.json();
  }

  // Get historical prices
  async getHistoricalPrices(tokens: string[], timestamp: number): Promise<any> {
    const tokensString = tokens.join(',');
    const response = await this.fetchWithRetry(
      this.ENDPOINTS.historicalPrices(tokensString, timestamp)
    );
    return await response.json();
  }

  // Get all protocols
  async getAllProtocols(): Promise<DeFiLlamaProtocol[]> {
    const response = await this.fetchWithRetry(this.ENDPOINTS.protocols());
    return await response.json();
  }

  // Get Cardano DEX volumes
  async getCardanoDexVolumes(): Promise<any> {
    const response = await this.fetchWithRetry(this.ENDPOINTS.cardanoDexes());
    return await response.json();
  }

  // Get TVL for a specific protocol
  async getProtocolTVL(protocol: string): Promise<any> {
    const response = await this.fetchWithRetry(this.ENDPOINTS.protocolTVL(protocol));
    return await response.json();
  }

  // Get Cardano TVL
  async getCardanoTVL(): Promise<any> {
    const response = await this.fetchWithRetry(this.ENDPOINTS.cardanoTVL());
    return await response.json();
  }
}
