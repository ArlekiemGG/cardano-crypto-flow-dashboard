
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

  // Connect to wallet with FORCED explicit authorization
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      console.log('=== STARTING EXPLICIT WALLET CONNECTION ===');
      console.log('Target wallet:', walletName);
      
      // CRITICAL: Clear any cached wallet data first
      setWalletState(initialState);
      
      // Clear localStorage to prevent any auto-connection attempts
      localStorage.removeItem('connectedWallet');
      localStorage.removeItem('walletAddress');
      
      // Force a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Requesting explicit authorization...');
      const connectionResult = await connectWalletHook(walletName);
      
      console.log('=== WALLET AUTHORIZATION SUCCESSFUL ===');
      console.log('Connection result:', connectionResult);
      console.log('Address format:', connectionResult.address);
      
      // Validate address format
      if (!connectionResult.address) {
        throw new Error('No address received from wallet');
      }
      
      // Log address details for debugging
      console.log('Received address:', connectionResult.address);
      console.log('Address starts with addr1:', connectionResult.address.startsWith('addr1'));
      console.log('Address length:', connectionResult.address.length);
      
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

      // Save wallet session to database with real data ONLY after successful explicit connection
      await walletService.saveWalletSession({
        address: connectionResult.address,
        walletName,
        stakeAddress: connectionResult.stakeAddress,
        network: connectionResult.network,
      });

      console.log('=== WALLET CONNECTED SUCCESSFULLY ===');
      console.log('Final address in state:', connectionResult.address);
      console.log('Network:', connectionResult.network);
      console.log('Stake address:', connectionResult.stakeAddress);
      
    } catch (error) {
      console.error('=== WALLET CONNECTION FAILED ===');
      console.error('Error details:', error);
      
      // Clear state on error
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect wallet with explicit authorization',
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
    
    // Clear ALL stored data to prevent any auto-reconnection
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
    
    // Reset to initial state
    setWalletState(initialState);
    
    console.log('Wallet disconnected and all cached data cleared');
  };

  // CRITICAL: NO AUTO-RECONNECTION
  // Users must explicitly authorize each session for security
  useEffect(() => {
    console.log('WalletProvider initialized - NO auto-reconnection for security compliance');
    console.log('All wallet connections require explicit user authorization');
    // NO auto-reconnection code - this ensures security compliance
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
