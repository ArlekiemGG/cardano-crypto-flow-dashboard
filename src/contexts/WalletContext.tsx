
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WalletApi as CardanoWalletApi } from '@/types/cardano';
import { getAvailableWallets } from '@/utils/walletUtils';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useBalanceManager } from '@/hooks/useBalanceManager';
import { walletService } from '@/services/walletService';

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
  const { isConnecting, error, connectWallet: connectWalletHook } = useWalletConnection();
  
  // Pass address to balance manager to fetch real data
  const { balance, utxos, refreshBalance, checkMinimumBalance } = useBalanceManager(
    walletState.walletApi,
    walletState.isConnected,
    walletState.address
  );

  // Update wallet state with balance and utxos from the balance manager (real Blockfrost data)
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      console.log('Updating wallet state with new balance:', balance);
      setWalletState(prev => ({
        ...prev,
        balance,
        utxos,
      }));
    }
  }, [balance, utxos, walletState.isConnected, walletState.address]);

  // Update wallet state with connection state
  useEffect(() => {
    setWalletState(prev => ({
      ...prev,
      isConnecting,
      error,
    }));
  }, [isConnecting, error]);

  // Connect to wallet
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      console.log('Attempting to connect to wallet:', walletName);
      
      const connectionResult = await connectWalletHook(walletName);
      
      console.log('Wallet connection successful, setting state...');
      console.log('Connection result:', connectionResult);
      
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        walletName,
        walletApi: connectionResult.walletApi,
        address: connectionResult.address,
        balance: 0, // Will be updated by useBalanceManager with real Blockfrost data
        network: connectionResult.network,
        utxos: [],
        stakeAddress: connectionResult.stakeAddress,
        error: null,
      }));

      // Save wallet session to database with real data
      await walletService.saveWalletSession({
        address: connectionResult.address,
        walletName,
        stakeAddress: connectionResult.stakeAddress,
        network: connectionResult.network,
      });

      console.log('Wallet connected successfully with address:', connectionResult.address);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnected: false,
      }));
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
    
    setWalletState(initialState);
    console.log('Wallet disconnected');
  };

  // Auto-reconnect on page load
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    const savedAddress = localStorage.getItem('walletAddress');
    
    console.log('Checking for saved wallet:', savedWallet, savedAddress);
    
    if (savedWallet && getAvailableWallets().includes(savedWallet)) {
      console.log('Attempting to auto-reconnect to saved wallet:', savedWallet);
      connectWallet(savedWallet).catch(error => {
        console.error('Auto-reconnect failed:', error);
        // Clear saved data if auto-reconnect fails
        localStorage.removeItem('connectedWallet');
        localStorage.removeItem('walletAddress');
      });
    }
  }, []);

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
