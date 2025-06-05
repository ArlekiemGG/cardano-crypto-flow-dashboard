
interface MuesliSwapPool {
  id: string;
  token_a: {
    symbol: string;
    policy_id: string;
    asset_name: string;
    decimals: number;
  };
  token_b: {
    symbol: string;
    policy_id: string;
    asset_name: string;
    decimals: number;
  };
  reserve_a: string;
  reserve_b: string;
  liquidity_a: string;
  liquidity_b: string;
  volume_24h: string;
  fees: string;
  price: string;
}

interface MuesliSwapPrice {
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  dex: string;
}

export class MuesliSwapService {
  private readonly API_ENDPOINT = 'https://api.muesliswap.com';

  private async request(endpoint: string) {
    const response = await fetch(`${this.API_ENDPOINT}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`MuesliSwap API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchRealPools(): Promise<MuesliSwapPool[]> {
    try {
      const data = await this.request('/pools');
      return Array.isArray(data) ? data : data.pools || [];
    } catch (error) {
      console.error('Error fetching MuesliSwap pools:', error);
      return [];
    }
  }

  async calculateRealPrices(): Promise<MuesliSwapPrice[]> {
    const pools = await this.fetchRealPools();
    const prices: MuesliSwapPrice[] = [];

    for (const pool of pools) {
      try {
        const reserveA = parseFloat(pool.reserve_a || pool.liquidity_a || '0');
        const reserveB = parseFloat(pool.reserve_b || pool.liquidity_b || '0');
        
        if (reserveA > 0 && reserveB > 0) {
          const price = pool.price ? parseFloat(pool.price) : reserveB / reserveA;
          const symbolA = pool.token_a?.symbol || 'ADA';
          const symbolB = pool.token_b?.symbol || 'Token';
          
          prices.push({
            pair: `${symbolA}/${symbolB}`,
            price,
            volume24h: parseFloat(pool.volume_24h || '0'),
            liquidity: reserveA + reserveB,
            dex: 'MuesliSwap'
          });
        }
      } catch (error) {
        console.error('Error calculating price for MuesliSwap pool:', pool.id, error);
      }
    }

    return prices;
  }

  async getRealVolumes(): Promise<{ pair: string; volume24h: number }[]> {
    const pools = await this.fetchRealPools();
    return pools
      .filter(pool => pool.volume_24h)
      .map(pool => ({
        pair: `${pool.token_a?.symbol || 'ADA'}/${pool.token_b?.symbol || 'Token'}`,
        volume24h: parseFloat(pool.volume_24h)
      }))
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 50);
  }

  async getMarketOverview(): Promise<any> {
    try {
      return await this.request('/market');
    } catch (error) {
      console.error('Error fetching MuesliSwap market overview:', error);
      return null;
    }
  }

  async getTokenPrice(tokenSymbol: string): Promise<number | null> {
    try {
      const data = await this.request(`/price/${tokenSymbol}`);
      return data.price || null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }
}

export const muesliSwapService = new MuesliSwapService();
