
import { supabase } from '@/integrations/supabase/client';

const BLOCKFROST_API_KEY = 'mainnetpUHEGp8g3PU5BLzMlHXxsqLH7iYHW7Av';
const BLOCKFROST_BASE_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

interface BlockfrostAsset {
  asset: string;
  policy_id: string;
  asset_name: string;
  fingerprint: string;
  quantity: string;
  initial_mint_tx_hash: string;
  mint_or_burn_count: number;
  onchain_metadata: any;
  metadata: any;
}

interface BlockfrostPrice {
  unit: string;
  quantity: string;
}

export class BlockfrostService {
  private headers = {
    'project_id': BLOCKFROST_API_KEY,
    'Content-Type': 'application/json'
  };

  async getADAPrice(): Promise<number> {
    try {
      // Get ADA price from a reliable source (CoinGecko as fallback)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');
      const data = await response.json();
      return data.cardano?.usd || 0;
    } catch (error) {
      console.error('Error fetching ADA price:', error);
      return 0;
    }
  }

  async getPoolInfo(poolId: string) {
    try {
      const response = await fetch(`${BLOCKFROST_BASE_URL}/pools/${poolId}`, {
        headers: this.headers
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching pool info:', error);
      throw error;
    }
  }

  async getAddressUtxos(address: string) {
    try {
      const response = await fetch(`${BLOCKFROST_BASE_URL}/addresses/${address}/utxos`, {
        headers: this.headers
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching address UTXOs:', error);
      throw error;
    }
  }

  async getLatestBlock() {
    try {
      const response = await fetch(`${BLOCKFROST_BASE_URL}/blocks/latest`, {
        headers: this.headers
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest block:', error);
      throw error;
    }
  }
}

export const blockfrostService = new BlockfrostService();
