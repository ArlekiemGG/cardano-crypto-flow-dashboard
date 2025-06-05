
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WalletApi as CardanoWalletApi } from '@/types/cardano';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletName: string | null;
  walletApi: CardanoWalletApi | null;
  address: string | null;
  balance: number;
  network: 'Mainnet' | 'Testnet';
  utxos: any[];
  stakeAddress: string | null;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => void;
  getAvailableWallets: () => string[];
  refreshBalance: () => Promise<void>;
  checkMinimumBalance: (minAda: number) => boolean;
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  walletName: null,
  walletApi: null,
  address: null,
  balance: 0,
  network: 'Mainnet',
  utxos: [],
  stakeAddress: null,
  error: null,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>(initialState);

  // Get available wallets from window.cardano
  const getAvailableWallets = (): string[] => {
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

  // Convert hex to address (simplified)
  const hexToAddress = (hex: string): string => {
    try {
      // This is a simplified conversion - in production you'd use proper Cardano address libraries
      return hex;
    } catch (error) {
      console.error('Error converting hex to address:', error);
      return hex;
    }
  };

  // Convert lovelace to ADA
  const lovelaceToAda = (lovelace: string): number => {
    try {
      return parseInt(lovelace, 16) / 1000000;
    } catch (error) {
      console.error('Error converting lovelace to ADA:', error);
      return 0;
    }
  };

  // Connect to wallet using native Cardano wallet APIs
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

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

      // Get wallet balance
      const balanceHex = await walletApi.getBalance();
      const balance = lovelaceToAda(balanceHex);

      // Get UTXOs
      let utxos: any[] = [];
      try {
        const utxosHex = await walletApi.getUtxos();
        utxos = utxosHex || [];
      } catch (error) {
        console.warn('Could not fetch UTXOs:', error);
      }

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

      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        walletName,
        walletApi,
        address,
        balance,
        network,
        utxos,
        stakeAddress,
        error: null,
      }));

      console.log(`Successfully connected to ${walletName} wallet`);
      console.log('Address:', address);
      console.log('Balance:', balance, 'ADA');
      console.log('Network:', network);
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
    
    setWalletState(initialState);
    console.log('Wallet disconnected');
  };

  // Refresh balance
  const refreshBalance = async (): Promise<void> => {
    if (!walletState.walletApi || !walletState.isConnected) return;

    try {
      const balanceHex = await walletState.walletApi.getBalance();
      const balance = lovelaceToAda(balanceHex);

      const utxosHex = await walletState.walletApi.getUtxos();
      const utxos = utxosHex || [];

      setWalletState(prev => ({
        ...prev,
        balance,
        utxos,
      }));

      console.log('Balance refreshed:', balance, 'ADA');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  // Check minimum balance for premium access
  const checkMinimumBalance = (minAda: number): boolean => {
    return walletState.balance >= minAda;
  };

  // Auto-reconnect on page load
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet && getAvailableWallets().includes(savedWallet)) {
      connectWallet(savedWallet);
    }
  }, []);

  // Refresh balance periodically
  useEffect(() => {
    if (walletState.isConnected) {
      const interval = setInterval(refreshBalance, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [walletState.isConnected]);

  const contextValue: WalletContextType = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    getAvailableWallets,
    refreshBalance,
    checkMinimumBalance,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
