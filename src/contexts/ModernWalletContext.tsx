
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useModernWalletState, WalletState } from '@/hooks/useModernWalletState';
import { useModernWalletConnection } from '@/hooks/useModernWalletConnection';
import { useModernWalletBalance } from '@/hooks/useModernWalletBalance';
import { 
  getAvailableWallets, 
  hasWallet, 
  setupWalletCleanup, 
  clearWalletStorage 
} from '@/utils/modernWalletUtils';

export interface WalletContextType extends WalletState {
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => void;
  getAvailableWallets: () => string[];
  refreshBalance: () => Promise<void>;
  checkMinimumBalance: (minAda: number) => boolean;
  hasWallet: (walletName: string) => boolean;
}

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
  const { walletState, updateWalletState, resetWalletState } = useModernWalletState();
  const { connectWallet: connectWalletHook } = useModernWalletConnection();
  const { refreshBalance } = useModernWalletBalance(
    walletState.lucid,
    walletState.walletApi,
    walletState.isConnected,
    updateWalletState
  );

  // Connect to wallet
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      updateWalletState({
        isConnecting: true,
        error: null,
      });

      const connectionResult = await connectWalletHook(walletName);

      // Update state with real wallet data
      updateWalletState({
        isConnected: true,
        isConnecting: false,
        walletName,
        walletApi: connectionResult.walletApi,
        lucid: connectionResult.lucid,
        address: connectionResult.address,
        balance: connectionResult.balance,
        error: null,
        lastUpdate: new Date(),
      });
      
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
      
      updateWalletState({
        isConnecting: false,
        error: errorMessage,
        isConnected: false,
      });
      
      throw error;
    }
  };

  // Check minimum balance for premium access
  const checkMinimumBalance = (minAda: number): boolean => {
    return walletState.balance >= minAda;
  };

  // Disconnect wallet - COMPLETELY clear state without persistence
  const disconnectWallet = () => {
    console.log('=== DISCONNECTING WALLET - NO PERSISTENCE ===');
    resetWalletState();
    clearWalletStorage();
    console.log('Wallet disconnected completely - no session saved');
  };

  // Clear wallet state on page/tab close
  useEffect(() => {
    return setupWalletCleanup(resetWalletState);
  }, []);

  // Initialize with NO persistence - NEVER auto-reconnect
  useEffect(() => {
    console.log('=== MODERN WALLET PROVIDER INITIALIZED ===');
    console.log('Configuration: NO PERSISTENCE, NO AUTO-RECONNECTION');
    
    const availableWallets = getAvailableWallets();
    console.log('Available wallets:', availableWallets);
    console.log('Wallet will ALWAYS disconnect when browser tab closes');
    
    // Ensure no lingering session data
    clearWalletStorage();
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
