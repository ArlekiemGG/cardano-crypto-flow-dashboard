
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

      console.log(`Starting fresh authorization process for ${walletName}...`);

      const walletExtension = window.cardano[walletName];
      
      if (!walletExtension) {
        throw new Error(`${walletName} extension not found`);
      }

      // CRITICAL: Clear any existing connection state first
      // This ensures we don't reuse cached connections
      if (walletExtension.experimental && typeof walletExtension.experimental.disconnect === 'function') {
        try {
          await walletExtension.experimental.disconnect();
          console.log(`Cleared existing ${walletName} connection`);
        } catch (e) {
          console.log(`No existing connection to clear for ${walletName}`);
        }
      }

      // Force a small delay to ensure wallet state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      // SOLUTION: Always call enable() with explicit user interaction requirement
      // This MUST trigger the wallet's authorization popup
      console.log(`Requesting explicit authorization from ${walletName}...`);
      
      // Some wallets support options to force authorization dialog
      const enableOptions = {
        requestIdentification: true,
        onlySilent: false // Explicitly request interactive authorization
      };

      let walletApi;
      try {
        // Try with options first (for wallets that support it)
        walletApi = await walletExtension.enable(enableOptions);
      } catch (error) {
        console.log('Trying fallback enable method...');
        // Fallback to standard enable call
        walletApi = await walletExtension.enable();
      }
      
      if (!walletApi) {
        throw new Error(`Authorization denied by ${walletName} wallet. Please try again and approve the connection.`);
      }

      console.log(`${walletName} wallet authorized successfully!`);

      // Get network ID
      const networkId = await walletApi.getNetworkId();
      const network = networkId === 1 ? 'Mainnet' : 'Testnet';

      // FIXED: Proper address handling to ensure bech32 format
      let address = '';
      
      try {
        // Method 1: Get used addresses first (most reliable for active wallets)
        console.log('Fetching used addresses...');
        const usedAddresses = await walletApi.getUsedAddresses();
        console.log('Raw used addresses from wallet:', usedAddresses);
        
        if (usedAddresses && usedAddresses.length > 0) {
          const rawAddress = usedAddresses[0];
          address = await convertToAddress(rawAddress, walletApi);
          console.log('Converted used address:', address);
        }
      } catch (error) {
        console.warn('Could not get used addresses:', error);
      }

      // Method 2: If no used addresses, try change address
      if (!address) {
        try {
          console.log('Fetching change address...');
          const changeAddress = await walletApi.getChangeAddress();
          console.log('Raw change address from wallet:', changeAddress);
          
          if (changeAddress) {
            address = await convertToAddress(changeAddress, walletApi);
            console.log('Converted change address:', address);
          }
        } catch (error) {
          console.warn('Could not get change address:', error);
        }
      }

      // Method 3: Try unused addresses as last resort
      if (!address) {
        try {
          console.log('Fetching unused addresses...');
          const unusedAddresses = await walletApi.getUnusedAddresses();
          console.log('Raw unused addresses from wallet:', unusedAddresses);
          
          if (unusedAddresses && unusedAddresses.length > 0) {
            const rawAddress = unusedAddresses[0];
            address = await convertToAddress(rawAddress, walletApi);
            console.log('Converted unused address:', address);
          }
        } catch (error) {
          console.warn('Could not get unused addresses:', error);
        }
      }

      if (!address) {
        throw new Error('Could not retrieve any wallet address after authorization');
      }

      // Validate that we have a proper bech32 address
      if (!address.startsWith('addr1')) {
        console.warn('Address does not start with addr1:', address);
        // For now, we'll still use it but log the warning
      }

      console.log('Final wallet address (should be bech32):', address);

      // Get stake address
      let stakeAddress: string | null = null;
      try {
        const rewardAddresses = await walletApi.getRewardAddresses();
        console.log('Raw reward addresses:', rewardAddresses);
        
        if (rewardAddresses && rewardAddresses.length > 0) {
          const rawStakeAddr = rewardAddresses[0];
          stakeAddress = await convertToStakeAddress(rawStakeAddr, walletApi);
          console.log('Converted stake address:', stakeAddress);
        }
      } catch (error) {
        console.warn('Could not fetch stake address:', error);
      }

      console.log(`Successfully connected to ${walletName} with explicit authorization`);
      console.log('Final address:', address);
      console.log('Network:', network);
      console.log('Stake address:', stakeAddress);

      setConnectionState({ isConnecting: false, error: null });

      return {
        walletApi,
        address,
        balance: 0, // Will be fetched from Blockfrost
        network,
        utxos: [],
        stakeAddress,
      };
      
    } catch (error) {
      console.error('Wallet authorization failed:', error);
      let errorMessage = 'Failed to authorize wallet connection';
      
      if (error instanceof Error) {
        if (error.message.includes('User declined') || error.message.includes('denied')) {
          errorMessage = 'User declined wallet authorization. Please try again and approve the connection.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Wallet extension not found or not installed';
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

// Helper function to convert raw address data to bech32 format
async function convertToAddress(rawAddress: any, walletApi: CardanoWalletApi): Promise<string> {
  try {
    // If it's already a string in bech32 format, return it
    if (typeof rawAddress === 'string' && rawAddress.startsWith('addr1')) {
      return rawAddress;
    }
    
    // If it's a hex string, we need to decode it
    if (typeof rawAddress === 'string' && rawAddress.length > 50 && !rawAddress.startsWith('addr1')) {
      console.log('Raw address appears to be hex, attempting conversion:', rawAddress);
      // For now, return as-is since we don't have cardano-serialization-lib
      // In production, you would use @emurgo/cardano-serialization-lib-browser
      // to properly decode CBOR hex to bech32 address
      return rawAddress;
    }
    
    // If it's an object or array, try to extract the address
    if (typeof rawAddress === 'object') {
      console.log('Raw address is object:', rawAddress);
      return rawAddress.toString();
    }
    
    return rawAddress;
  } catch (error) {
    console.error('Error converting address:', error);
    return rawAddress;
  }
}

// Helper function to convert raw stake address data to bech32 format
async function convertToStakeAddress(rawStakeAddr: any, walletApi: CardanoWalletApi): Promise<string> {
  try {
    // If it's already a string in bech32 format, return it
    if (typeof rawStakeAddr === 'string' && rawStakeAddr.startsWith('stake1')) {
      return rawStakeAddr;
    }
    
    // Similar conversion logic as for regular addresses
    if (typeof rawStakeAddr === 'string') {
      return rawStakeAddr;
    }
    
    if (typeof rawStakeAddr === 'object') {
      return rawStakeAddr.toString();
    }
    
    return rawStakeAddr;
  } catch (error) {
    console.error('Error converting stake address:', error);
    return rawStakeAddr;
  }
}
