
import { useState } from 'react';
import type { WalletApi as CardanoWalletApi } from '@/types/cardano';

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

      // Check if window.cardano exists
      if (!window.cardano) {
        throw new Error('No Cardano wallets detected. Please install a Cardano wallet extension.');
      }

      const walletExtension = window.cardano[walletName];
      
      if (!walletExtension) {
        throw new Error(`${walletName} wallet not found. Please install the ${walletName} wallet extension.`);
      }

      // Check if wallet is enabled/available
      const isEnabled = await walletExtension.isEnabled();
      console.log(`${walletName} enabled status:`, isEnabled);

      // Request wallet access - this will show authorization popup
      console.log(`Requesting authorization from ${walletName}...`);
      const walletApi = await walletExtension.enable();
      
      if (!walletApi) {
        throw new Error(`Failed to connect to ${walletName}. Please try again and approve the connection.`);
      }

      console.log(`${walletName} connected successfully!`);

      // Get network ID
      const networkId = await walletApi.getNetworkId();
      const network = networkId === 1 ? 'Mainnet' : 'Testnet';
      console.log('Network:', network, 'ID:', networkId);

      // Get wallet address - try multiple methods
      let address = '';
      
      try {
        // Try to get used addresses first
        const usedAddresses = await walletApi.getUsedAddresses();
        if (usedAddresses && usedAddresses.length > 0) {
          address = usedAddresses[0];
        }
      } catch (error) {
        console.warn('Could not get used addresses:', error);
      }

      // If no used addresses, try change address
      if (!address) {
        try {
          const changeAddress = await walletApi.getChangeAddress();
          if (changeAddress) {
            address = changeAddress;
          }
        } catch (error) {
          console.warn('Could not get change address:', error);
        }
      }

      // If still no address, try unused addresses
      if (!address) {
        try {
          const unusedAddresses = await walletApi.getUnusedAddresses();
          if (unusedAddresses && unusedAddresses.length > 0) {
            address = unusedAddresses[0];
          }
        } catch (error) {
          console.warn('Could not get unused addresses:', error);
        }
      }

      if (!address) {
        throw new Error('Could not retrieve wallet address. Please try reconnecting your wallet.');
      }

      // Convert hex address to bech32 if needed
      if (typeof address === 'string' && address.length > 50 && !address.startsWith('addr')) {
        console.log('Converting hex address to bech32 format...');
        // For production, use proper cardano-serialization-lib conversion
        // For now, we'll work with the hex format but log it
        console.warn('Address is in hex format:', address);
      }

      console.log('Final wallet address:', address);

      // Get stake address
      let stakeAddress: string | null = null;
      try {
        const rewardAddresses = await walletApi.getRewardAddresses();
        if (rewardAddresses && rewardAddresses.length > 0) {
          stakeAddress = rewardAddresses[0];
        }
      } catch (error) {
        console.warn('Could not get stake address:', error);
      }

      // Get initial balance from wallet
      let walletBalance = 0;
      try {
        const balanceHex = await walletApi.getBalance();
        walletBalance = parseInt(balanceHex, 16) / 1000000; // Convert from lovelace to ADA
      } catch (error) {
        console.warn('Could not get balance from wallet:', error);
      }

      console.log(`${walletName} connection complete:`, {
        address,
        network,
        stakeAddress,
        walletBalance
      });

      setConnectionState({ isConnecting: false, error: null });

      return {
        walletApi,
        address,
        balance: walletBalance,
        network,
        utxos: [],
        stakeAddress,
      };
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      let errorMessage = 'Failed to connect wallet';
      
      if (error instanceof Error) {
        if (error.message.includes('User declined') || error.message.includes('denied')) {
          errorMessage = 'Connection denied by user. Please try again and approve the connection.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Wallet extension not found. Please install the wallet extension and refresh the page.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setConnectionState({ isConnecting: false, error: errorMessage });
      throw error;
    }
  };

  return {
    ...connectionState,
    connectWallet,
  };
};
