
import { supabase } from '@/integrations/supabase/client';
import { blockfrostService } from '@/services/blockfrostService';

export interface WalletConnection {
  address: string;
  balance: number;
  isConnected: boolean;
  walletName?: string;
  stakeAddress?: string;
  network?: string;
}

export class WalletService {
  private currentWallet: WalletConnection | null = null;

  async connectWallet(): Promise<WalletConnection> {
    try {
      // This method is now deprecated in favor of useWallet hook with real Blockfrost integration
      // Keeping for backward compatibility
      throw new Error('Use useWallet hook instead for real blockchain integration');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.currentWallet = null;
  }

  getCurrentWallet(): WalletConnection | null {
    return this.currentWallet;
  }

  async getPortfolioValue(walletAddress: string): Promise<number> {
    try {
      // Get balance from Blockfrost (currently mock implementation)
      const addressInfo = await blockfrostService.getAddressInfo(walletAddress);
      const realBalance = blockfrostService.getAdaBalance(addressInfo);
      
      console.log('Portfolio value from Blockfrost (mock):', realBalance);
      return realBalance;
    } catch (error) {
      console.error('Error fetching portfolio value:', error);
      return 0;
    }
  }

  // Get wallet connection status from context (this will be managed by WalletContext now)
  async getWalletConnection(): Promise<WalletConnection | null> {
    // This method is now deprecated in favor of useWallet hook
    // Keeping for backward compatibility
    return null;
  }

  // Save wallet session to database
  async saveWalletSession(walletData: {
    address: string;
    walletName: string;
    stakeAddress?: string;
    network: string;
  }): Promise<void> {
    try {
      // Get balance from Blockfrost (currently mock implementation)
      const addressInfo = await blockfrostService.getAddressInfo(walletData.address);
      const realBalance = blockfrostService.getAdaBalance(addressInfo);

      await supabase
        .from('users')
        .upsert({
          wallet_address: walletData.address,
          last_login: new Date().toISOString(),
          is_active: true,
          settings_json: {
            walletName: walletData.walletName,
            stakeAddress: walletData.stakeAddress,
            network: walletData.network,
            connectedAt: new Date().toISOString(),
            realBalance: realBalance
          }
        });

      console.log('Wallet session saved to database with Blockfrost balance (mock):', realBalance);
    } catch (error) {
      console.error('Error saving wallet session:', error);
    }
  }

  // Update portfolio metrics with real wallet data
  async updatePortfolioMetrics(walletAddress: string): Promise<void> {
    try {
      // Get balance from Blockfrost (currently mock implementation)
      const addressInfo = await blockfrostService.getAddressInfo(walletAddress);
      const realBalance = blockfrostService.getAdaBalance(addressInfo);

      await supabase
        .from('portfolio_metrics')
        .upsert({
          user_wallet: walletAddress,
          total_value: realBalance,
          updated_at: new Date().toISOString()
        });

      console.log('Portfolio metrics updated from Blockfrost (mock) for wallet:', walletAddress, 'Balance:', realBalance);
    } catch (error) {
      console.error('Error updating portfolio metrics:', error);
    }
  }

  // Get historical portfolio data
  async getPortfolioHistory(walletAddress: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('portfolio_metrics')
        .select('*')
        .eq('user_wallet', walletAddress)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      return [];
    }
  }

  // Verify stake pool information using Blockfrost data (currently mock)
  async verifyStakePool(stakeAddress: string): Promise<{
    poolId?: string;
    poolName?: string;
    isStaked: boolean;
  }> {
    try {
      // Use Blockfrost API to get stake pool info (currently mock implementation)
      const addressInfo = await blockfrostService.getAddressInfo(stakeAddress);
      return {
        poolId: addressInfo.stake_address || undefined,
        poolName: 'Mock Pool',
        isStaked: !!addressInfo.stake_address
      };
    } catch (error) {
      console.error('Error verifying stake pool with Blockfrost:', error);
      return { isStaked: false };
    }
  }

  // Get UTXO data from Blockfrost (currently mock)
  async getUTXOs(address: string): Promise<any[]> {
    try {
      const utxos = await blockfrostService.getAddressUtxos(address);
      console.log('UTXOs fetched from Blockfrost (mock):', utxos.length);
      return utxos;
    } catch (error) {
      console.error('Error fetching UTXOs from Blockfrost:', error);
      return [];
    }
  }
}

export const walletService = new WalletService();
