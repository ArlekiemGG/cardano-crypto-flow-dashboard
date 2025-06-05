
import { supabase } from '@/integrations/supabase/client';

export interface WalletConnection {
  address: string;
  balance: number;
  isConnected: boolean;
}

export class WalletService {
  private currentWallet: WalletConnection | null = null;

  async connectWallet(): Promise<WalletConnection> {
    try {
      // Simulated wallet connection - in production, integrate with actual Cardano wallets
      const mockWalletAddress = 'addr1q9f8qr6t0p5w6e8r9y7u8i0o3q2w1e4r5t6y7u8i9o0p1q2w3e4r5t6y7u8i9o0p1q2w3e4r5';
      const mockBalance = 12450.67;

      // Create or update user in database
      await supabase
        .from('users')
        .upsert({
          wallet_address: mockWalletAddress,
          last_login: new Date().toISOString(),
          is_active: true
        });

      // Initialize portfolio metrics
      await supabase
        .from('portfolio_metrics')
        .upsert({
          user_wallet: mockWalletAddress,
          total_value: mockBalance,
          updated_at: new Date().toISOString()
        });

      this.currentWallet = {
        address: mockWalletAddress,
        balance: mockBalance,
        isConnected: true
      };

      return this.currentWallet;
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
      const { data } = await supabase
        .from('portfolio_metrics')
        .select('total_value')
        .eq('user_wallet', walletAddress)
        .single();

      return Number(data?.total_value) || 0;
    } catch (error) {
      console.error('Error fetching portfolio value:', error);
      return 0;
    }
  }
}

export const walletService = new WalletService();
