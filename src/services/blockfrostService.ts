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
  private headers = {
    'project_id': BLOCKFROST_API_KEY,
    'Content-Type': 'application/json'
  };

  private async request(endpoint: string) {
    const response = await fetch(`${BLOCKFROST_BASE_URL}${endpoint}`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Blockfrost API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getADAPrice(): Promise<number> {
    try {
      // Get latest epoch parameters for network data
      const epochParams = await this.request('/epochs/latest/parameters');
      
      // Fallback to CoinGecko for USD price as Blockfrost doesn't provide fiat prices
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');
      const data = await response.json();
      return data.cardano?.usd || 0;
    } catch (error) {
      console.error('Error fetching ADA price:', error);
      return 0;
    }
  }

  async getPoolInfo(poolId: string): Promise<BlockfrostPool> {
    return await this.request(`/pools/${poolId}`);
  }

  async getAllPools(): Promise<string[]> {
    return await this.request('/pools');
  }

  async getPoolsExtended(page: number = 1): Promise<BlockfrostPool[]> {
    return await this.request(`/pools/extended?page=${page}&count=100`);
  }

  async getAddressUtxos(address: string): Promise<BlockfrostUtxo[]> {
    return await this.request(`/addresses/${address}/utxos`);
  }

  async getLatestBlock() {
    return await this.request('/blocks/latest');
  }

  async getNetworkInfo() {
    return await this.request('/network');
  }

  async getAssetInfo(asset: string): Promise<BlockfrostAsset> {
    return await this.request(`/assets/${asset}`);
  }

  async getTransaction(txHash: string) {
    return await this.request(`/txs/${txHash}`);
  }

  async getTransactionUtxos(txHash: string) {
    return await this.request(`/txs/${txHash}/utxos`);
  }

  async getAddressTransactions(address: string, page: number = 1) {
    return await this.request(`/addresses/${address}/transactions?page=${page}&count=50&order=desc`);
  }
}

export const blockfrostService = new BlockfrostService();
