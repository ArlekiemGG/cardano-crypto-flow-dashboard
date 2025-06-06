
// Convert hex to address (simplified)
export const hexToAddress = (hex: string): string => {
  try {
    // This is a simplified conversion - in production you'd use proper Cardano address libraries
    return hex;
  } catch (error) {
    console.error('Error converting hex to address:', error);
    return hex;
  }
};

// Convert lovelace to ADA
export const lovelaceToAda = (lovelace: string): number => {
  try {
    return parseInt(lovelace, 16) / 1000000;
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
