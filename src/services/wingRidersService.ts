
interface WingRidersPool {
  id: string;
  address: string;
  tokenA: {
    policyId: string;
    assetName: string;
    ticker: string;
    decimals: number;
  };
  tokenB: {
    policyId: string;
    assetName: string;
    ticker: string;
    decimals: number;
  };
  reserveA: string;
  reserveB: string;
  totalLpTokens: string;
  volume24h: string;
  fees24h: string;
  tvl: string;
}

interface WingRidersPrice {
  pair: string;
  price: number;
  volume24h: number;
  tvl: number;
  dex: string;
}

export class WingRidersService {
  private readonly GRAPHQL_ENDPOINT = 'https://api.wingriders.com/graphql';

  private async graphqlRequest(query: string, variables: any = {}) {
    const response = await fetch(this.GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`WingRiders GraphQL error: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async fetchRealPools(): Promise<WingRidersPool[]> {
    const query = `
      query GetPools {
        pools {
          id
          address
          tokenA {
            policyId
            assetName
            ticker
            decimals
          }
          tokenB {
            policyId
            assetName
            ticker
            decimals
          }
          reserveA
          reserveB
          totalLpTokens
          volume24h
          fees24h
          tvl
        }
      }
    `;

    try {
      const data = await this.graphqlRequest(query);
      return data.pools || [];
    } catch (error) {
      console.error('Error fetching WingRiders pools:', error);
      return [];
    }
  }

  async calculateRealPrices(): Promise<WingRidersPrice[]> {
    const pools = await this.fetchRealPools();
    const prices: WingRidersPrice[] = [];

    for (const pool of pools) {
      try {
        const reserveA = parseFloat(pool.reserveA);
        const reserveB = parseFloat(pool.reserveB);
        
        if (reserveA > 0 && reserveB > 0) {
          const price = reserveB / reserveA;
          const tickerA = pool.tokenA?.ticker || 'ADA';
          const tickerB = pool.tokenB?.ticker || 'Token';
          
          prices.push({
            pair: `${tickerA}/${tickerB}`,
            price,
            volume24h: parseFloat(pool.volume24h || '0'),
            tvl: parseFloat(pool.tvl || '0'),
            dex: 'WingRiders'
          });
        }
      } catch (error) {
        console.error('Error calculating price for WingRiders pool:', pool.id, error);
      }
    }

    return prices;
  }

  async getRealVolumes(): Promise<{ pair: string; volume24h: number }[]> {
    const pools = await this.fetchRealPools();
    return pools
      .filter(pool => pool.volume24h)
      .map(pool => ({
        pair: `${pool.tokenA?.ticker || 'ADA'}/${pool.tokenB?.ticker || 'Token'}`,
        volume24h: parseFloat(pool.volume24h)
      }))
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 50);
  }

  async getPoolByTokens(tokenA: string, tokenB: string): Promise<WingRidersPool | null> {
    const query = `
      query GetPoolByTokens($tokenA: String!, $tokenB: String!) {
        pool(tokenA: $tokenA, tokenB: $tokenB) {
          id
          address
          tokenA { policyId assetName ticker decimals }
          tokenB { policyId assetName ticker decimals }
          reserveA
          reserveB
          totalLpTokens
          volume24h
          fees24h
          tvl
        }
      }
    `;

    try {
      const data = await this.graphqlRequest(query, { tokenA, tokenB });
      return data.pool || null;
    } catch (error) {
      console.error('Error fetching pool by tokens:', error);
      return null;
    }
  }
}

export const wingRidersService = new WingRidersService();
