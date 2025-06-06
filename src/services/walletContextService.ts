
import { supabase } from '@/integrations/supabase/client';

export class WalletContextService {
  static async setCurrentUserWallet(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_current_user_wallet', {
        wallet_address: walletAddress
      });

      if (error) {
        console.error('Error setting wallet context:', error);
        throw error;
      }

      console.log('✅ Wallet context set for RLS:', walletAddress);
    } catch (error) {
      console.error('Failed to set wallet context:', error);
      throw error;
    }
  }

  static async executeWithWalletContext<T>(
    walletAddress: string,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.setCurrentUserWallet(walletAddress);
    return operation();
  }
}

export const walletContextService = new WalletContextService();
