
const BLOCKFROST_API_KEY = 'mainnetqDbcAxZGzm4fvd6efh43cp81lL1VK6TT';
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

interface BlockfrostAddressInfo {
  address: string;
  amount: Array<{
    unit: string;
    quantity: string;
  }>;
  stake_address: string | null;
  type: string;
  script: boolean;
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
  private async makeBlockfrostRequest(endpoint: string) {
    try {
      console.log(`Making Blockfrost request to: ${BLOCKFROST_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${BLOCKFROST_BASE_URL}${endpoint}`, {
        headers: {
          'project_id': BLOCKFROST_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Blockfrost response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Blockfrost API error response:', errorText);
        throw new Error(`Blockfrost API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Blockfrost response data:', data);
      return data;
    } catch (error) {
      console.error('Error making Blockfrost request:', error);
      throw error;
    }
  }

  async getAddressInfo(address: string): Promise<BlockfrostAddressInfo> {
    console.log('Fetching real address info from Blockfrost for:', address);
    
    // Validate address format
    if (!address || (!address.startsWith('addr1') && !address.startsWith('DdzFF'))) {
      console.warn('Invalid address format, trying anyway:', address);
    }
    
    return await this.makeBlockfrostRequest(`/addresses/${address}`);
  }

  async getAddressUtxos(address: string): Promise<BlockfrostUtxo[]> {
    console.log('Fetching real UTXOs from Blockfrost for:', address);
    
    // Validate address format
    if (!address || (!address.startsWith('addr1') && !address.startsWith('DdzFF'))) {
      console.warn('Invalid address format, trying anyway:', address);
    }
    
    return await this.makeBlockfrostRequest(`/addresses/${address}/utxos`);
  }

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

  async getPoolInfo(poolId: string): Promise<BlockfrostPool> {
    return await this.makeBlockfrostRequest(`/pools/${poolId}`);
  }

  async getAllPools(): Promise<string[]> {
    return await this.makeBlockfrostRequest('/pools');
  }

  async getPoolsExtended(page: number = 1): Promise<BlockfrostPool[]> {
    return await this.makeBlockfrostRequest(`/pools/extended?page=${page}&count=100`);
  }

  async getLatestBlock() {
    return await this.makeBlockfrostRequest('/blocks/latest');
  }

  async getNetworkInfo() {
    return await this.makeBlockfrostRequest('/network');
  }

  async getAssetInfo(asset: string): Promise<BlockfrostAsset> {
    return await this.makeBlockfrostRequest(`/assets/${asset}`);
  }

  async getTransaction(txHash: string) {
    return await this.makeBlockfrostRequest(`/txs/${txHash}`);
  }

  async getTransactionUtxos(txHash: string) {
    return await this.makeBlockfrostRequest(`/txs/${txHash}/utxos`);
  }

  async getAddressTransactions(address: string, page: number = 1) {
    return await this.makeBlockfrostRequest(`/addresses/${address}/transactions?page=${page}&count=50&order=desc`);
  }

  // Convert lovelace string to ADA
  lovelaceToAda(lovelace: string): number {
    return parseInt(lovelace) / 1000000;
  }

  // Get ADA balance from address info
  getAdaBalance(addressInfo: BlockfrostAddressInfo): number {
    const adaAmount = addressInfo.amount.find(amount => amount.unit === 'lovelace');
    return adaAmount ? this.lovelaceToAda(adaAmount.quantity) : 0;
  }
}

export const blockfrostService = new BlockfrostService();
