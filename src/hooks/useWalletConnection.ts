
import { useState } from 'react';

interface WalletConnectionResult {
  walletApi: any;
  address: string;
  balance: number;
  network: 'Mainnet' | 'Testnet';
  utxos: any[];
  stakeAddress: string | null;
}

export const useWalletConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async (walletName: string): Promise<WalletConnectionResult> => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log(`Connecting to ${walletName} wallet...`);

      // Check if wallet is available
      if (!window.cardano || !window.cardano[walletName]) {
        throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
      }

      // Connect to wallet
      const walletApi = await window.cardano[walletName].enable();
      
      if (!walletApi) {
        throw new Error(`Failed to connect to ${walletName}. Please approve the connection.`);
      }

      // Get wallet address
      const usedAddresses = await walletApi.getUsedAddresses();
      const changeAddress = await walletApi.getChangeAddress();
      const address = usedAddresses?.[0] || changeAddress;

      if (!address) {
        throw new Error('Could not retrieve wallet address');
      }

      // Get balance
      const balanceHex = await walletApi.getBalance();
      const balance = parseInt(balanceHex, 16) / 1000000; // Convert from lovelace to ADA

      // Get UTXOs
      const utxos = await walletApi.getUtxos() || [];

      // Get stake address
      let stakeAddress = null;
      try {
        const rewardAddresses = await walletApi.getRewardAddresses();
        stakeAddress = rewardAddresses?.[0] || null;
      } catch (error) {
        console.warn('Could not get stake address:', error);
      }

      // Determine network (simplified)
      const network: 'Mainnet' | 'Testnet' = 'Mainnet';

      return {
        walletApi,
        address,
        balance,
        network,
        utxos,
        stakeAddress
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connectWallet,
    isConnecting,
    error
  };
};
