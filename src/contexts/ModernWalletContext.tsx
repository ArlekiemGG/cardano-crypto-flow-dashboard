
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletState, WalletContextType } from '@/types/wallet';
import { CARDANO_NETWORK, BALANCE_REFRESH_INTERVAL } from '@/constants/walletConstants';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useWalletBalance } from '@/hooks/useWalletBalance';

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
  
  const { 
    isConnecting, 
    error: connectionError, 
    connectWallet: connectWalletHook,
    hasWallet,
    getAvailableWallets 
  } = useWalletConnection();
  
  const { 
    refreshBalance: refreshBalanceHook, 
    checkMinimumBalance: checkMinimumBalanceHook 
  } = useWalletBalance();

  // Connect wallet wrapper
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      const { walletApi, lucid, address, balance } = await connectWalletHook(walletName);
      
      setWalletState({
        isConnected: true,
        isConnecting: false,
        walletName,
        walletApi,
        lucid,
        address,
        balance,
        network: CARDANO_NETWORK,
        error: null,
        lastUpdate: new Date(),
      });
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: connectionError,
        isConnected: false,
      }));
      throw error;
    }
  };

  // Refresh balance wrapper
  const refreshBalance = async (): Promise<void> => {
    try {
      const newBalance = await refreshBalanceHook(
        walletState.lucid, 
        walletState.walletApi, 
        walletState.isConnected
      );
      
      if (newBalance !== null) {
        setWalletState(prev => ({
          ...prev,
          balance: newBalance,
          lastUpdate: new Date(),
        }));
      }
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: 'Failed to refresh balance',
      }));
    }
  };

  // Check minimum balance wrapper
  const checkMinimumBalance = (minAda: number): boolean => {
    return checkMinimumBalanceHook(walletState.balance, minAda);
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
    }, BALANCE_REFRESH_INTERVAL);

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
    isConnecting,
    error: connectionError || walletState.error,
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
