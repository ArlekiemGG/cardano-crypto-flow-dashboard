
interface CoinGeckoADAData {
  cardano: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

interface CoinGeckoDetailedData {
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
    total_volume: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
  };
}

interface AddressInfo {
  amount: Array<{ unit: string; quantity: string }>;
  stake_address: string | null;
}

interface UTXO {
  tx_hash: string;
  output_index: number;
  amount: Array<{ unit: string; quantity: string }>;
}

export class BlockfrostService {
  private readonly COINGECKO_SIMPLE_API = 'https://api.coingecko.com/api/v3/simple/price';
  private readonly COINGECKO_DETAILED_API = 'https://api.coingecko.com/api/v3/coins/cardano';

  async getCompleteADAData(): Promise<{
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
  } | null> {
    try {
      console.log('🔍 Fetching complete ADA data from CoinGecko...');
      
      // Try detailed endpoint first for more accurate data
      const detailedResponse = await fetch(
        `${this.COINGECKO_DETAILED_API}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      );

      if (detailedResponse.ok) {
        const detailedData: CoinGeckoDetailedData = await detailedResponse.json();
        const result = {
          price: detailedData.market_data.current_price.usd,
          change24h: detailedData.market_data.price_change_percentage_24h || 0,
          volume24h: detailedData.market_data.total_volume.usd,
          marketCap: detailedData.market_data.market_cap.usd
        };

        console.log('✅ Complete ADA data fetched from detailed endpoint:', result);
        return result;
      }

      // Fallback to simple endpoint with additional parameters
      console.log('🔄 Falling back to simple endpoint with extended data...');
      const simpleResponse = await fetch(
        `${this.COINGECKO_SIMPLE_API}?ids=cardano&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`
      );

      if (!simpleResponse.ok) {
        throw new Error(`CoinGecko API error: ${simpleResponse.status}`);
      }

      const simpleData: CoinGeckoADAData = await simpleResponse.json();
      
      if (!simpleData.cardano) {
        throw new Error('No ADA data found in CoinGecko response');
      }

      const result = {
        price: simpleData.cardano.usd,
        change24h: simpleData.cardano.usd_24h_change || 0,
        volume24h: simpleData.cardano.usd_24h_vol || 0,
        marketCap: simpleData.cardano.usd_market_cap || 0
      };

      console.log('✅ Complete ADA data fetched from simple endpoint:', result);
      return result;

    } catch (error) {
      console.error('❌ Error fetching complete ADA data:', error);
      return null;
    }
  }

  // Legacy method for backward compatibility
  async getADAPrice(): Promise<number> {
    const completeData = await this.getCompleteADAData();
    return completeData?.price || 0;
  }

  // Method to validate if we have complete data
  validateADAData(data: any): boolean {
    return !!(
      data &&
      typeof data.price === 'number' &&
      typeof data.change24h === 'number' &&
      typeof data.volume24h === 'number' &&
      typeof data.marketCap === 'number' &&
      data.price > 0
    );
  }

  // Mock methods for address info - these would normally use Blockfrost API
  async getAddressInfo(address: string): Promise<AddressInfo> {
    console.log('Mock: Getting address info for', address);
    // This is a mock implementation - in real usage, this would call Blockfrost API
    return {
      amount: [{ unit: 'lovelace', quantity: '1000000' }], // 1 ADA = 1,000,000 lovelace
      stake_address: null
    };
  }

  getAdaBalance(addressInfo: AddressInfo): number {
    const lovelaceAmount = addressInfo.amount.find(asset => asset.unit === 'lovelace');
    return lovelaceAmount ? parseInt(lovelaceAmount.quantity) / 1000000 : 0;
  }

  async getAddressUtxos(address: string): Promise<UTXO[]> {
    console.log('Mock: Getting UTXOs for', address);
    // This is a mock implementation - in real usage, this would call Blockfrost API
    return [
      {
        tx_hash: 'mock_tx_hash',
        output_index: 0,
        amount: [{ unit: 'lovelace', quantity: '1000000' }]
      }
    ];
  }
}

export const blockfrostService = new BlockfrostService();
