
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

      if (!window.cardano || !window.cardano[walletName]) {
        throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
      }

      // Enable wallet
      const walletApi = await window.cardano[walletName].enable();
      
      console.log('Wallet API enabled:', walletApi);

      // Get network ID
      const networkId = await walletApi.getNetworkId();
      const network = networkId === 1 ? 'Mainnet' : 'Testnet';

      // Get wallet addresses - try multiple methods
      let address = '';
      
      try {
        // Method 1: Try to get used addresses first
        const usedAddresses = await walletApi.getUsedAddresses();
        console.log('Used addresses from wallet:', usedAddresses);
        
        if (usedAddresses && usedAddresses.length > 0) {
          // Convert from CBOR hex to bech32 if needed
          const firstAddress = usedAddresses[0];
          if (typeof firstAddress === 'string') {
            // If it's already a bech32 address
            if (firstAddress.startsWith('addr1')) {
              address = firstAddress;
            } else {
              // Try to decode CBOR hex - for now just use the hex
              address = firstAddress;
            }
          }
        }
      } catch (error) {
        console.warn('Could not get used addresses:', error);
      }

      // Method 2: If no used addresses, try unused addresses
      if (!address) {
        try {
          const unusedAddresses = await walletApi.getUnusedAddresses();
          console.log('Unused addresses from wallet:', unusedAddresses);
          
          if (unusedAddresses && unusedAddresses.length > 0) {
            const firstAddress = unusedAddresses[0];
            if (typeof firstAddress === 'string') {
              if (firstAddress.startsWith('addr1')) {
                address = firstAddress;
              } else {
                address = firstAddress;
              }
            }
          }
        } catch (error) {
          console.warn('Could not get unused addresses:', error);
        }
      }

      // Method 3: Fallback to change address
      if (!address) {
        try {
          const changeAddress = await walletApi.getChangeAddress();
          console.log('Change address from wallet:', changeAddress);
          
          if (typeof changeAddress === 'string') {
            if (changeAddress.startsWith('addr1')) {
              address = changeAddress;
            } else {
              address = changeAddress;
            }
          }
        } catch (error) {
          console.warn('Could not get change address:', error);
        }
      }

      if (!address) {
        throw new Error('Could not retrieve wallet address');
      }

      console.log('Final wallet address obtained:', address);

      // Get stake address
      let stakeAddress: string | null = null;
      try {
        const rewardAddresses = await walletApi.getRewardAddresses();
        if (rewardAddresses && rewardAddresses.length > 0) {
          const firstRewardAddr = rewardAddresses[0];
          if (typeof firstRewardAddr === 'string') {
            stakeAddress = firstRewardAddr.startsWith('stake1') ? firstRewardAddr : firstRewardAddr;
          }
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
      console.log('Stake address:', stakeAddress);

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
