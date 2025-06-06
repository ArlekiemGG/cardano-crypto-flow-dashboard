
import { Lucid, Blockfrost, LucidEvolution } from '@lucid-evolution/lucid';

// Environment configuration
export const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';
export const BLOCKFROST_PROJECT_ID = 'mainnetqDbcAxZGzm4fvd6efh43cp81lL1VK6TT';
export const CARDANO_NETWORK = 'Mainnet';

// Supported wallets for 2025
export const SUPPORTED_WALLETS = ['eternl', 'nami', 'yoroi', 'flint', 'typhoncip30', 'gerowallet', 'brave'];

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

// Check if wallet is available
export const hasWallet = (walletName: string): boolean => {
  if (typeof window === 'undefined' || !window.cardano) return false;
  return !!window.cardano[walletName];
};

// Get available wallets
export const getAvailableWallets = (): string[] => {
  if (typeof window === 'undefined' || !window.cardano) return [];
  
  return SUPPORTED_WALLETS.filter(walletName => {
    const wallet = window.cardano[walletName];
    return wallet && typeof wallet.enable === 'function';
  });
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

// Clear wallet state on page/tab close
export const setupWalletCleanup = (clearWalletState: () => void) => {
  const handleBeforeUnload = () => {
    console.log('Page unloading - clearing wallet state');
    clearWalletState();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('Tab hidden - wallet will disconnect when tab closes');
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Clear any lingering session data
export const clearWalletStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('walletConnection');
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletSession');
  }
};
