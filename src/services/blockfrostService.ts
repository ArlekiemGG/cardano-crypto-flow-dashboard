
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

interface BlockfrostUtxo {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: Array<{
    unit: string;
    quantity: string;
  }>;
  block: string;
  data_hash?: string;
}

interface BlockfrostPool {
  pool_id: string;
  hex: string;
  vrf_key: string;
  blocks_minted: number;
  blocks_epoch: number;
  live_stake: string;
  live_size: number;
  live_saturation: number;
  live_delegators: number;
  active_stake: string;
  active_size: number;
  declared_pledge: string;
  live_pledge: string;
  margin_cost: number;
  fixed_cost: string;
  reward_account: string;
  owners: string[];
  registration: string[];
  retirement: string[];
}

export class BlockfrostService {
  async getADAPrice(): Promise<number> {
    try {
      // Use CoinGecko for USD price as it's public and doesn't require API key
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');
      const data = await response.json();
      return data.cardano?.usd || 0;
    } catch (error) {
      console.error('Error fetching ADA price:', error);
      return 0;
    }
  }

  // For Blockfrost-specific methods that require API key, we'll use the edge function
  private async callBlockfrostViaEdgeFunction(endpoint: string) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ 
          action: 'blockfrost_request',
          endpoint: endpoint
        })
      });

      if (error) {
        console.error('Error calling Blockfrost via edge function:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in Blockfrost edge function call:', error);
      throw error;
    }
  }

  async getPoolInfo(poolId: string): Promise<BlockfrostPool> {
    return await this.callBlockfrostViaEdgeFunction(`/pools/${poolId}`);
  }

  async getAllPools(): Promise<string[]> {
    return await this.callBlockfrostViaEdgeFunction('/pools');
  }

  async getPoolsExtended(page: number = 1): Promise<BlockfrostPool[]> {
    return await this.callBlockfrostViaEdgeFunction(`/pools/extended?page=${page}&count=100`);
  }

  async getAddressUtxos(address: string): Promise<BlockfrostUtxo[]> {
    return await this.callBlockfrostViaEdgeFunction(`/addresses/${address}/utxos`);
  }

  async getLatestBlock() {
    return await this.callBlockfrostViaEdgeFunction('/blocks/latest');
  }

  async getNetworkInfo() {
    return await this.callBlockfrostViaEdgeFunction('/network');
  }

  async getAssetInfo(asset: string): Promise<BlockfrostAsset> {
    return await this.callBlockfrostViaEdgeFunction(`/assets/${asset}`);
  }

  async getTransaction(txHash: string) {
    return await this.callBlockfrostViaEdgeFunction(`/txs/${txHash}`);
  }

  async getTransactionUtxos(txHash: string) {
    return await this.callBlockfrostViaEdgeFunction(`/txs/${txHash}/utxos`);
  }

  async getAddressTransactions(address: string, page: number = 1) {
    return await this.callBlockfrostViaEdgeFunction(`/addresses/${address}/transactions?page=${page}&count=50&order=desc`);
  }
}

export const blockfrostService = new BlockfrostService();
