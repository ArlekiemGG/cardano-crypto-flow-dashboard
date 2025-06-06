
import { Lucid, Blockfrost, LucidEvolution } from '@lucid-evolution/lucid';
import { BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID, CARDANO_NETWORK } from '@/constants/walletConstants';

// Initialize Lucid Evolution with Blockfrost
export const initializeLucid = async (): Promise<LucidEvolution> => {
  console.log('Initializing Lucid Evolution with Blockfrost...');
  
  try {
    const blockfrost = new Blockfrost(
      BLOCKFROST_API_URL,
      BLOCKFROST_PROJECT_ID
    );

    const lucid = await Lucid(blockfrost, CARDANO_NETWORK);
    console.log('Lucid Evolution initialized successfully');
    
    return lucid;
  } catch (error) {
    console.error('Failed to initialize Lucid:', error);
    throw new Error('Failed to initialize blockchain connection');
  }
};

// Convert hex address to bech32 if needed
export const convertAddress = (hexAddress: string): string => {
  // If already bech32, return as is
  if (hexAddress.startsWith('addr')) {
    return hexAddress;
  }
  
  // For now, return hex address as is - proper conversion would require cardano-serialization-lib
  console.warn('Address is in hex format, conversion needed:', hexAddress);
  return hexAddress;
};

// Get wallet address using multiple fallback methods
export const getWalletAddress = async (lucid: LucidEvolution, walletApi: any): Promise<string> => {
  let address = '';
  
  try {
    // Try Lucid's method first
    address = await lucid.wallet().address();
  } catch (error) {
    console.warn('Lucid address method failed, trying wallet API directly:', error);
    
    // Fallback to wallet API methods
    try {
      const usedAddresses = await walletApi.getUsedAddresses();
      if (usedAddresses && usedAddresses.length > 0) {
        address = convertAddress(usedAddresses[0]);
      }
    } catch (error) {
      console.warn('getUsedAddresses failed:', error);
    }
    
    if (!address) {
      try {
        const changeAddress = await walletApi.getChangeAddress();
        if (changeAddress) {
          address = convertAddress(changeAddress);
        }
      } catch (error) {
        console.warn('getChangeAddress failed:', error);
      }
    }
  }

  if (!address) {
    throw new Error('Could not retrieve wallet address. Please try reconnecting.');
  }

  return address;
};

// Get wallet balance using multiple fallback methods
export const getWalletBalance = async (lucid: LucidEvolution, walletApi: any): Promise<number> => {
  let balance = 0;
  
  try {
    const utxos = await lucid.wallet().getUtxos();
    balance = utxos.reduce((total, utxo) => {
      return total + Number(utxo.assets.lovelace) / 1000000;
    }, 0);
  } catch (error) {
    console.warn('Failed to get balance from Lucid, trying wallet API:', error);
    
    try {
      const balanceHex = await walletApi.getBalance();
      balance = parseInt(balanceHex, 16) / 1000000;
    } catch (error) {
      console.warn('Failed to get balance from wallet API:', error);
      balance = 0; // Default to 0 if balance fetch fails
    }
  }

  return balance;
};
