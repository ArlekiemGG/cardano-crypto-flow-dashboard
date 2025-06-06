
// Convert hex to address using proper Cardano address handling
export const hexToAddress = (hex: string): string => {
  try {
    // If it's already a bech32 address, return as is
    if (hex.startsWith('addr1') || hex.startsWith('stake1')) {
      console.log('Address already in bech32 format:', hex);
      return hex;
    }
    
    // For hex addresses, we need proper conversion
    // In production, use @emurgo/cardano-serialization-lib-browser
    console.log('Converting hex address to bech32:', hex);
    
    // For now, return the hex as is with a warning
    // This should be replaced with proper CBOR decoding in production
    console.warn('Address conversion needed - using hex format temporarily:', hex);
    return hex;
  } catch (error) {
    console.error('Error converting hex to address:', error);
    return hex;
  }
};

// Convert lovelace to ADA
export const lovelaceToAda = (lovelace: string): number => {
  try {
    return parseInt(lovelace) / 1000000;
  } catch (error) {
    console.error('Error converting lovelace to ADA:', error);
    return 0;
  }
};

// Get available wallets from window.cardano
export const getAvailableWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  const availableWallets: string[] = [];
  
  // Check for common Cardano wallets
  const walletNames = ['nami', 'eternl', 'flint', 'vespr', 'yoroi', 'gerowallet', 'nufi'];
  
  walletNames.forEach(walletName => {
    if (window.cardano && window.cardano[walletName]) {
      console.log(`Found wallet: ${walletName}`);
      availableWallets.push(walletName);
    }
  });
  
  console.log('Available wallets:', availableWallets);
  return availableWallets;
};

// Validate bech32 address format
export const validateBech32Address = (address: string): boolean => {
  try {
    // Basic validation for Cardano mainnet addresses
    if (address.startsWith('addr1')) {
      // Mainnet address should be around 103 characters
      return address.length >= 100 && address.length <= 110;
    }
    
    // For testnet addresses
    if (address.startsWith('addr_test1')) {
      return address.length >= 100 && address.length <= 115;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating bech32 address:', error);
    return false;
  }
};

// Format address for display
export const formatAddressForDisplay = (address: string): string => {
  if (!address) return '';
  
  // If it's a proper bech32 address, show it normally
  if (validateBech32Address(address)) {
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  }
  
  // For hex addresses, show a different format
  if (address.length > 20) {
    return `${address.slice(0, 8)}...${address.slice(-8)} (hex)`;
  }
  
  return address;
};
