
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Blockfrost, Lucid, Network, UTxO } from 'lucid-cardano';
import type { WalletApi } from '@/types/cardano';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletName: string | null;
  walletApi: WalletApi | null;
  address: string | null;
  balance: number;
  network: Network;
  lucid: Lucid | null;
  utxos: UTxO[];
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
  lucid: null,
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

  // Initialize Lucid with Blockfrost
  const initializeLucid = async (network: Network = 'Mainnet') => {
    try {
      const blockfrostUrl = network === 'Mainnet' 
        ? 'https://cardano-mainnet.blockfrost.io/api/v0'
        : 'https://cardano-testnet.blockfrost.io/api/v0';
      
      // Using a public Blockfrost endpoint for demo - in production use your API key
      const blockfrost = new Blockfrost(blockfrostUrl, 'mainnet1234567890'); // Replace with real API key
      
      const lucid = await Lucid.new(blockfrost, network);
      return lucid;
    } catch (error) {
      console.error('Failed to initialize Lucid:', error);
      return null;
    }
  };

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

  // Connect to wallet
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

      if (!window.cardano || !window.cardano[walletName]) {
        throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
      }

      // Enable wallet
      const walletApi = await window.cardano[walletName].enable();
      
      // Initialize Lucid
      const lucid = await initializeLucid(walletState.network);
      if (!lucid) {
        throw new Error('Failed to initialize Lucid');
      }

      // Create a compatible wallet API for Lucid with proper signData signature
      const lucidWalletApi = {
        ...walletApi,
        getCollateral: walletApi.getCollateral || (() => Promise.resolve([])),
        signData: async (address: string, payload: string) => {
          const result = await walletApi.signData(address, payload);
          // Handle both possible return types from different wallets
          if (typeof result === 'string') {
            return { signature: result, key: '' };
          }
          return result;
        }
      };

      // Select wallet in Lucid
      lucid.selectWallet(lucidWalletApi);

      // Get wallet address
      const address = await lucid.wallet.address();
      
      // Get wallet balance
      const utxos = await lucid.wallet.getUtxos();
      const balance = utxos.reduce((total, utxo) => {
        const lovelace = utxo.assets.lovelace || 0n;
        return total + Number(lovelace) / 1000000; // Convert from lovelace to ADA
      }, 0);

      // Get stake address
      const rewardAddress = await lucid.wallet.rewardAddress();

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
        lucid,
        utxos,
        stakeAddress: rewardAddress,
        error: null,
      }));

      console.log(`Successfully connected to ${walletName} wallet`);
      console.log('Address:', address);
      console.log('Balance:', balance, 'ADA');
      
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
    if (!walletState.lucid || !walletState.isConnected) return;

    try {
      const utxos = await walletState.lucid.wallet.getUtxos();
      const balance = utxos.reduce((total, utxo) => {
        const lovelace = utxo.assets.lovelace || 0n;
        return total + Number(lovelace) / 1000000;
      }, 0);

      setWalletState(prev => ({
        ...prev,
        balance,
        utxos,
      }));
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
