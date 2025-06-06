
// Enhanced wallet utilities for real Cardano wallet integration

// Convert lovelace to ADA
export const lovelaceToAda = (lovelace: string | number): number => {
  try {
    const lovelaceNum = typeof lovelace === 'string' ? parseInt(lovelace) : lovelace;
    return lovelaceNum / 1000000;
  } catch (error) {
    console.error('Error converting lovelace to ADA:', error);
    return 0;
  }
};

// Convert ADA to lovelace
export const adaToLovelace = (ada: number): number => {
  return Math.floor(ada * 1000000);
};

// Get available wallets from window.cardano with real detection
export const getAvailableWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  const availableWallets: string[] = [];
  
  // Check for window.cardano first
  if (!window.cardano) {
    console.log('window.cardano not found - no wallets available');
    return [];
  }
  
  // Check for common Cardano wallets
  const walletNames = ['nami', 'eternl', 'flint', 'vespr', 'yoroi', 'gerowallet', 'nufi'];
  
  walletNames.forEach(walletName => {
    if (window.cardano && window.cardano[walletName]) {
      // Additional check to ensure it's a proper wallet object
      const wallet = window.cardano[walletName];
      if (wallet && typeof wallet.enable === 'function') {
        console.log(`Found wallet: ${walletName}`);
        availableWallets.push(walletName);
      }
    }
  });
  
  console.log('Available wallets:', availableWallets);
  return availableWallets;
};

// Validate Cardano address format
export const validateCardanoAddress = (address: string): boolean => {
  try {
    if (!address) return false;
    
    // Check for mainnet bech32 addresses
    if (address.startsWith('addr1')) {
      return address.length >= 100 && address.length <= 110;
    }
    
    // Check for testnet addresses
    if (address.startsWith('addr_test1')) {
      return address.length >= 100 && address.length <= 115;
    }
    
    // Check for legacy Byron addresses
    if (address.startsWith('DdzFF')) {
      return address.length >= 100;
    }
    
    // For hex addresses (some wallets return these)
    if (address.length > 50 && !address.startsWith('addr')) {
      console.warn('Address appears to be in hex format:', address);
      return true; // Accept hex for now, should be converted to bech32
    }
    
    return false;
  } catch (error) {
    console.error('Error validating address:', error);
    return false;
  }
};

// Format address for display
export const formatAddressForDisplay = (address: string): string => {
  if (!address) return '';
  
  // If it's a proper bech32 address
  if (validateCardanoAddress(address)) {
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  }
  
  // For other formats
  if (address.length > 20) {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }
  
  return address;
};

// Check if wallet supports specific features
export const checkWalletFeatures = async (walletApi: any): Promise<{
  hasStaking: boolean;
  hasCollateral: boolean;
  hasExperimental: boolean;
}> => {
  try {
    const features = {
      hasStaking: false,
      hasCollateral: false,
      hasExperimental: false,
    };

    // Check for staking support
    try {
      await walletApi.getRewardAddresses();
      features.hasStaking = true;
    } catch (error) {
      console.log('Staking not supported');
    }

    // Check for collateral support
    if (typeof walletApi.getCollateral === 'function') {
      features.hasCollateral = true;
    }

    // Check for experimental features
    if (walletApi.experimental) {
      features.hasExperimental = true;
    }

    return features;
  } catch (error) {
    console.error('Error checking wallet features:', error);
    return {
      hasStaking: false,
      hasCollateral: false,
      hasExperimental: false,
    };
  }
};

// Convert hex to proper Cardano address using CSL (simplified version)
export const hexToCardanoAddress = (hex: string, networkId: number = 1): string => {
  try {
    // This is a simplified version - in production use @emurgo/cardano-serialization-lib-browser
    if (hex.startsWith('addr1') || hex.startsWith('addr_test1')) {
      return hex; // Already bech32
    }
    
    // For now, return hex with a warning
    console.warn('Address conversion needed - using hex format temporarily:', hex);
    return hex;
  } catch (error) {
    console.error('Error converting hex to address:', error);
    return hex;
  }
};
