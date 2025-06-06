
import { useState } from 'react';
import type { WalletApi as CardanoWalletApi } from '@/types/cardano';
import { hexToAddress } from '@/utils/walletUtils';

interface WalletConnectionState {
  isConnecting: boolean;
  error: string | null;
}

export const useWalletConnection = () => {
  const [connectionState, setConnectionState] = useState<WalletConnectionState>({
    isConnecting: false,
    error: null,
  });

  const connectWallet = async (walletName: string): Promise<{
    walletApi: CardanoWalletApi;
    address: string;
    balance: number;
    network: 'Mainnet' | 'Testnet';
    utxos: any[];
    stakeAddress: string | null;
  }> => {
    try {
      setConnectionState({ isConnecting: true, error: null });

      if (!window.cardano || !window.cardano[walletName]) {
        throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
      }

      // Enable wallet
      const walletApi = await window.cardano[walletName].enable();
      
      console.log('Wallet API enabled:', walletApi);

      // Get network ID
      const networkId = await walletApi.getNetworkId();
      const network = networkId === 1 ? 'Mainnet' : 'Testnet';

      // Get wallet addresses
      const usedAddresses = await walletApi.getUsedAddresses();
      const unusedAddresses = await walletApi.getUnusedAddresses();
      
      let address = '';
      if (usedAddresses && usedAddresses.length > 0) {
        address = hexToAddress(usedAddresses[0]);
      } else if (unusedAddresses && unusedAddresses.length > 0) {
        address = hexToAddress(unusedAddresses[0]);
      } else {
        // Fallback: get change address
        address = await walletApi.getChangeAddress();
        address = hexToAddress(address);
      }

      console.log('Real wallet address obtained:', address);

      // Get stake address
      let stakeAddress: string | null = null;
      try {
        const rewardAddresses = await walletApi.getRewardAddresses();
        if (rewardAddresses && rewardAddresses.length > 0) {
          stakeAddress = hexToAddress(rewardAddresses[0]);
        }
      } catch (error) {
        console.warn('Could not fetch stake address:', error);
      }

      // Save to localStorage for persistence
      localStorage.setItem('connectedWallet', walletName);
      localStorage.setItem('walletAddress', address);

      setConnectionState({ isConnecting: false, error: null });

      console.log(`Successfully connected to ${walletName} wallet`);
      console.log('Real address:', address);
      console.log('Network:', network);
      console.log('Balance will be fetched from Blockfrost...');

      return {
        walletApi,
        address,
        balance: 0, // Will be fetched from Blockfrost
        network,
        utxos: [],
        stakeAddress,
      };
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setConnectionState({ isConnecting: false, error: errorMessage });
      throw error;
    }
  };

  return {
    ...connectionState,
    connectWallet,
  };
};
