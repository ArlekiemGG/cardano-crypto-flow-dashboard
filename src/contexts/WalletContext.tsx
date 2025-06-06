
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
  
  // Use balance manager for real blockchain data
  const { balance, utxos, refreshBalance, checkMinimumBalance } = useBalanceManager(
    walletState.walletApi,
    walletState.isConnected,
    walletState.address
  );

  // Update wallet state with real balance data
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      setWalletState(prev => ({
        ...prev,
        balance,
        utxos,
      }));
    }
  }, [balance, utxos, walletState.isConnected, walletState.address]);

  // Update connection state
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
      console.log('=== STARTING WALLET CONNECTION ===');
      console.log('Target wallet:', walletName);
      
      // Reset state
      setWalletState(initialState);
      
      // Connect to wallet
      const connectionResult = await connectWalletHook(walletName);
      
      console.log('=== WALLET CONNECTION SUCCESSFUL ===');
      console.log('Connection result:', connectionResult);
      
      // Validate the connection result
      if (!connectionResult.address) {
        throw new Error('No address received from wallet');
      }
      
      // Update state with real wallet data
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        walletName,
        walletApi: connectionResult.walletApi,
        address: connectionResult.address,
        balance: connectionResult.balance,
        network: connectionResult.network,
        utxos: connectionResult.utxos,
        stakeAddress: connectionResult.stakeAddress,
        error: null,
      }));

      // Save session with real data
      await walletService.saveWalletSession({
        address: connectionResult.address,
        walletName,
        stakeAddress: connectionResult.stakeAddress,
        network: connectionResult.network,
      });

      console.log('=== WALLET SESSION SAVED ===');
      console.log('Address:', connectionResult.address);
      console.log('Network:', connectionResult.network);
      
    } catch (error) {
      console.error('=== WALLET CONNECTION FAILED ===');
      console.error('Error:', error);
      
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnected: false,
        walletName: null,
        walletApi: null,
        address: null,
      }));
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    console.log('=== DISCONNECTING WALLET ===');
    setWalletState(initialState);
    console.log('Wallet disconnected');
  };

  // No auto-reconnection for security
  useEffect(() => {
    console.log('WalletProvider initialized - NO auto-reconnection');
    
    // Check if wallets are available
    const availableWallets = getAvailableWallets();
    console.log('Available wallets on startup:', availableWallets);
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
