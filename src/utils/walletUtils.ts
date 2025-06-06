
// Convert hex to address using proper Cardano address handling
export const hexToAddress = (hex: string): string => {
  try {
    // If it's already a bech32 address, return as is
    if (hex.startsWith('addr1') || hex.startsWith('stake1')) {
      return hex;
    }
    
    // For now, return the hex as is - in production you'd use @emurgo/cardano-serialization-lib-browser
    // to properly decode CBOR hex to bech32 address
    console.log('Converting hex address:', hex);
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
      availableWallets.push(walletName);
    }
  });
  
  return availableWallets;
};
