
export class WalletValidator {
  async validateWalletForTrading(walletApi: any): Promise<{
    valid: boolean;
    balance: number;
    error?: string;
  }> {
    try {
      const balanceHex = await walletApi.getBalance();
      const balance = parseInt(balanceHex, 16) / 1000000; // Convert lovelace to ADA

      if (balance < 10) { // Minimum 10 ADA for trading
        return {
          valid: false,
          balance,
          error: 'Insufficient balance for trading (minimum 10 ADA required)'
        };
      }

      return { valid: true, balance };
    } catch (error) {
      return {
        valid: false,
        balance: 0,
        error: 'Failed to validate wallet for trading'
      };
    }
  }

  async getWalletBalance(walletApi: any): Promise<number> {
    try {
      const balanceHex = await walletApi.getBalance();
      return parseInt(balanceHex, 16) / 1000000;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }
}

export const walletValidator = new WalletValidator();
