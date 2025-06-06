
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lucid, Blockfrost, WalletApi } from '@lucid-evolution/lucid';
import { BlockfrostApi } from 'blockfrost-js';

// Environment configuration
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';
const BLOCKFROST_PROJECT_ID = 'mainnetqDbcAxZGzm4fvd6efh43cp81lL1VK6TT';
const CARDANO_NETWORK = 'Mainnet';

// Supported wallets for 2025
const SUPPORTED_WALLETS = ['eternl', 'nami', 'yoroi', 'flint', 'typhoncip30', 'gerowallet', 'brave'];

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletName: string | null;
  walletApi: WalletApi | null;
  lucid: Lucid | null;
  address: string | null;
  balance: number;
  network: string;
  error: string | null;
  lastUpdate: Date | null;
}

export interface WalletContextType extends WalletState {
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => void;
  getAvailableWallets: () => string[];
  refreshBalance: () => Promise<void>;
  checkMinimumBalance: (minAda: number) => boolean;
  hasWallet: (walletName: string) => boolean;
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  walletName: null,
  walletApi: null,
  lucid: null,
  address: null,
  balance: 0,
  network: CARDANO_NETWORK,
  error: null,
  lastUpdate: null,
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

  // Initialize Lucid Evolution with Blockfrost
  const initializeLucid = async (): Promise<Lucid> => {
    console.log('Initializing Lucid Evolution with Blockfrost...');
    
    const blockfrost = new Blockfrost(
      BLOCKFROST_API_URL,
      BLOCKFROST_PROJECT_ID
    );

    const lucid = await Lucid.new(blockfrost, CARDANO_NETWORK);
    console.log('Lucid Evolution initialized successfully');
    
    return lucid;
  };

  // Check if wallet is available
  const hasWallet = (walletName: string): boolean => {
    if (typeof window === 'undefined' || !window.cardano) return false;
    return !!window.cardano[walletName];
  };

  // Get available wallets
  const getAvailableWallets = (): string[] => {
    if (typeof window === 'undefined' || !window.cardano) return [];
    
    return SUPPORTED_WALLETS.filter(walletName => {
      const wallet = window.cardano[walletName];
      return wallet && typeof wallet.enable === 'function';
    });
  };

  // Connect to wallet using Lucid Evolution
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      console.log(`=== CONNECTING TO ${walletName.toUpperCase()} WALLET ===`);
      
      setWalletState(prev => ({
        ...prev,
        isConnecting: true,
        error: null,
      }));

      // Check if wallet is available
      if (!hasWallet(walletName)) {
        throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
      }

      // Initialize Lucid
      const lucid = await initializeLucid();

      // Connect to wallet
      const walletApi = await window.cardano[walletName].enable();
      
      if (!walletApi) {
        throw new Error(`Failed to connect to ${walletName}. Please approve the connection.`);
      }

      // Select wallet in Lucid
      lucid.selectWallet(walletApi);

      // Get wallet address
      const address = await lucid.wallet.address();
      console.log('Wallet address:', address);

      // Get initial balance
      const utxos = await lucid.wallet.getUtxos();
      const balance = utxos.reduce((total, utxo) => {
        return total + Number(utxo.assets.lovelace) / 1000000;
      }, 0);

      console.log('Initial balance:', balance, 'ADA');

      // Update state
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        walletName,
        walletApi,
        lucid,
        address,
        balance,
        error: null,
        lastUpdate: new Date(),
      }));

      console.log(`=== ${walletName.toUpperCase()} WALLET CONNECTED SUCCESSFULLY ===`);
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      let errorMessage = 'Failed to connect wallet';
      if (error instanceof Error) {
        if (error.message.includes('User declined') || error.message.includes('denied')) {
          errorMessage = 'Connection denied by user. Please try again and approve the connection.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Wallet extension not found. Please install the wallet extension.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
        isConnected: false,
      }));
      
      throw error;
    }
  };

  // Refresh balance using Lucid Evolution
  const refreshBalance = async (): Promise<void> => {
    if (!walletState.lucid || !walletState.isConnected) {
      console.log('No Lucid instance or not connected, skipping balance refresh');
      return;
    }

    try {
      console.log('Refreshing balance...');
      
      const utxos = await walletState.lucid.wallet.getUtxos();
      const balance = utxos.reduce((total, utxo) => {
        return total + Number(utxo.assets.lovelace) / 1000000;
      }, 0);

      setWalletState(prev => ({
        ...prev,
        balance,
        lastUpdate: new Date(),
      }));

      console.log('Balance updated:', balance, 'ADA');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      setWalletState(prev => ({
        ...prev,
        error: 'Failed to refresh balance',
      }));
    }
  };

  // Check minimum balance for premium access
  const checkMinimumBalance = (minAda: number): boolean => {
    return walletState.balance >= minAda;
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    console.log('=== DISCONNECTING WALLET ===');
    setWalletState(initialState);
    console.log('Wallet disconnected');
  };

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!walletState.isConnected) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [walletState.isConnected, walletState.lucid]);

  // Auto-reconnection logic (simplified for security)
  useEffect(() => {
    console.log('Modern WalletProvider initialized - 2025 configuration');
    const availableWallets = getAvailableWallets();
    console.log('Available wallets:', availableWallets);
  }, []);

  const contextValue: WalletContextType = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    getAvailableWallets,
    refreshBalance,
    checkMinimumBalance,
    hasWallet,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
