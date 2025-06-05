
interface MinswapPool {
  id: string;
  address: string;
  assetA: {
    policyId: string;
    assetName: string;
    decimals: number;
  };
  assetB: {
    policyId: string;
    assetName: string;
    decimals: number;
  };
  reserveA: string;
  reserveB: string;
  totalShares: string;
  fee: string;
  volume24h: string;
  tvl: string;
}

interface MinswapPrice {
  pair: string;
  price: number;
  volume24h: number;
  reserveA: number;
  reserveB: number;
  dex: string;
}

export class MinswapService {
  private readonly GRAPHQL_ENDPOINT = 'https://graphql-api.mainnet.dandelion.link';
  
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
      throw new Error(`Minswap GraphQL error: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async fetchRealPools(): Promise<MinswapPool[]> {
    const query = `
      query GetPools($limit: Int, $offset: Int) {
        pools(limit: $limit, offset: $offset, where: {isValid: {_eq: true}}) {
          id
          address
          assetA {
            policyId
            assetName
            decimals
          }
          assetB {
            policyId
            assetName
            decimals
          }
          reserveA
          reserveB
          totalShares
          fee
          volume24h
          tvl
        }
      }
    `;

    try {
      const data = await this.graphqlRequest(query, { limit: 100, offset: 0 });
      return data.pools || [];
    } catch (error) {
      console.error('Error fetching Minswap pools:', error);
      return [];
    }
  }

  async calculateRealPrices(): Promise<MinswapPrice[]> {
    const pools = await this.fetchRealPools();
    const prices: MinswapPrice[] = [];

    for (const pool of pools) {
      try {
        const reserveA = parseFloat(pool.reserveA);
        const reserveB = parseFloat(pool.reserveB);
        
        if (reserveA > 0 && reserveB > 0) {
          const price = reserveB / reserveA;
          const assetAName = pool.assetA.assetName || 'ADA';
          const assetBName = pool.assetB.assetName || 'Token';
          
          prices.push({
            pair: `${assetAName}/${assetBName}`,
            price,
            volume24h: parseFloat(pool.volume24h || '0'),
            reserveA,
            reserveB,
            dex: 'Minswap'
          });
        }
      } catch (error) {
        console.error('Error calculating price for pool:', pool.id, error);
      }
    }

    return prices;
  }

  async getRealVolumes(): Promise<{ pair: string; volume24h: number }[]> {
    const pools = await this.fetchRealPools();
    return pools
      .filter(pool => pool.volume24h)
      .map(pool => ({
        pair: `${pool.assetA.assetName || 'ADA'}/${pool.assetB.assetName || 'Token'}`,
        volume24h: parseFloat(pool.volume24h)
      }))
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 50);
  }

  async getPoolByAssets(assetA: string, assetB: string): Promise<MinswapPool | null> {
    const query = `
      query GetPoolByAssets($assetA: String!, $assetB: String!) {
        pools(where: {
          _and: [
            {assetA: {assetName: {_eq: $assetA}}},
            {assetB: {assetName: {_eq: $assetB}}},
            {isValid: {_eq: true}}
          ]
        }, limit: 1) {
          id
          address
          assetA { policyId assetName decimals }
          assetB { policyId assetName decimals }
          reserveA
          reserveB
          totalShares
          fee
          volume24h
          tvl
        }
      }
    `;

    try {
      const data = await this.graphqlRequest(query, { assetA, assetB });
      return data.pools?.[0] || null;
    } catch (error) {
      console.error('Error fetching pool by assets:', error);
      return null;
    }
  }
}

export const minswapService = new MinswapService();
