
interface SundaeSwapPool {
  ident: string;
  assetA: {
    assetId: string;
    decimals: number;
  };
  assetB: {
    assetId: string;
    decimals: number;
  };
  quantityA: string;
  quantityB: string;
  tvl: string;
  volume: {
    rolling24Hours: string;
  };
  fees: {
    percentage: string;
  };
}

interface SundaeSwapPrice {
  pair: string;
  price: number;
  volume24h: number;
  tvl: number;
  dex: string;
}

export class SundaeSwapService {
  private readonly API_ENDPOINT = 'https://stats.sundaeswap.finance/api';

  private async request(endpoint: string) {
    const response = await fetch(`${this.API_ENDPOINT}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CardanoTrading/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`SundaeSwap API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchRealPools(): Promise<SundaeSwapPool[]> {
    try {
      const data = await this.request('/pools');
      return data.pools || [];
    } catch (error) {
      console.error('Error fetching SundaeSwap pools:', error);
      return [];
    }
  }

  async calculateRealPrices(): Promise<SundaeSwapPrice[]> {
    const pools = await this.fetchRealPools();
    const prices: SundaeSwapPrice[] = [];

    for (const pool of pools) {
      try {
        const quantityA = parseFloat(pool.quantityA);
        const quantityB = parseFloat(pool.quantityB);
        
        if (quantityA > 0 && quantityB > 0) {
          const price = quantityB / quantityA;
          const assetAId = pool.assetA.assetId;
          const assetBId = pool.assetB.assetId;
          
          // Extract asset names from asset IDs
          const assetAName = assetAId === 'ada' ? 'ADA' : assetAId.slice(-8);
          const assetBName = assetBId === 'ada' ? 'ADA' : assetBId.slice(-8);
          
          prices.push({
            pair: `${assetAName}/${assetBName}`,
            price,
            volume24h: parseFloat(pool.volume?.rolling24Hours || '0'),
            tvl: parseFloat(pool.tvl || '0'),
            dex: 'SundaeSwap'
          });
        }
      } catch (error) {
        console.error('Error calculating price for SundaeSwap pool:', pool.ident, error);
      }
    }

    return prices;
  }

  async getRealVolumes(): Promise<{ pair: string; volume24h: number }[]> {
    const pools = await this.fetchRealPools();
    return pools
      .filter(pool => pool.volume?.rolling24Hours)
      .map(pool => {
        const assetAId = pool.assetA.assetId;
        const assetBId = pool.assetB.assetId;
        const assetAName = assetAId === 'ada' ? 'ADA' : assetAId.slice(-8);
        const assetBName = assetBId === 'ada' ? 'ADA' : assetBId.slice(-8);
        
        return {
          pair: `${assetAName}/${assetBName}`,
          volume24h: parseFloat(pool.volume.rolling24Hours)
        };
      })
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 50);
  }

  async getPoolStats(): Promise<any> {
    try {
      return await this.request('/stats');
    } catch (error) {
      console.error('Error fetching SundaeSwap stats:', error);
      return null;
    }
  }
}

export const sundaeSwapService = new SundaeSwapService();
