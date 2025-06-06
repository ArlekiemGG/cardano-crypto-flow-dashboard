
import { useState } from 'react';
import { LucidEvolution } from '@lucid-evolution/lucid';
import { initializeLucid, getWalletAddress, getWalletBalance } from '@/utils/lucidUtils';
import { SUPPORTED_WALLETS } from '@/constants/walletConstants';

export const useWalletConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is available
  const hasWallet = (walletName: string): boolean => {
    if (typeof window === 'undefined' || !window.cardano) return false;
    return !!window.cardano[walletName];
  };

  // Get available wallets
  const getAvailableWallets = (): string[] => {
    if (typeof window === 'undefined' || !window.cardano) return [];
    
    return SUPPORTED_WALLETS.filter(walletName => {
      const wallet = window.cardano[walletName];
      return wallet && typeof wallet.enable === 'function';
    });
  };

  // Connect to wallet using Lucid Evolution
  const connectWallet = async (walletName: string): Promise<{
    walletApi: any;
    lucid: LucidEvolution;
    address: string;
    balance: number;
  }> => {
    try {
      console.log(`=== CONNECTING TO ${walletName.toUpperCase()} WALLET ===`);
      
      setIsConnecting(true);
      setError(null);

      // Check if wallet is available
      if (!hasWallet(walletName)) {
        throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
      }

      // Initialize Lucid
      const lucid = await initializeLucid();

      // Connect to wallet
      const walletApi = await window.cardano[walletName].enable();
      
      if (!walletApi) {
        throw new Error(`Failed to connect to ${walletName}. Please approve the connection.`);
      }

      // Select wallet in Lucid
      lucid.selectWallet.fromAPI(walletApi);

      // Get wallet address
      const address = await getWalletAddress(lucid, walletApi);
      console.log('Wallet address:', address);

      // Get initial balance
      const balance = await getWalletBalance(lucid, walletApi);
      console.log('Initial balance:', balance, 'ADA');

      console.log(`=== ${walletName.toUpperCase()} WALLET CONNECTED SUCCESSFULLY ===`);
      
      return { walletApi, lucid, address, balance };
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      let errorMessage = 'Failed to connect wallet';
      if (error instanceof Error) {
        if (error.message.includes('User declined') || error.message.includes('denied')) {
          errorMessage = 'Connection denied by user. Please try again and approve the connection.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Wallet extension not found. Please install the wallet extension.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    isConnecting,
    error,
    connectWallet,
    hasWallet,
    getAvailableWallets,
  };
};
