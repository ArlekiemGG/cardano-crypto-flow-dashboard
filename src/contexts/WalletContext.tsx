
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

  // Connect to wallet with manual authorization
  const connectWallet = async (walletName: string): Promise<void> => {
    try {
      console.log('Initiating manual wallet connection for:', walletName);
      
      const connectionResult = await connectWalletHook(walletName);
      
      console.log('Manual wallet authorization successful, setting state...');
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

      // Save wallet session to database with real data ONLY after successful manual connection
      await walletService.saveWalletSession({
        address: connectionResult.address,
        walletName,
        stakeAddress: connectionResult.stakeAddress,
        network: connectionResult.network,
      });

      // Save to localStorage ONLY after successful manual authorization
      localStorage.setItem('connectedWallet', walletName);
      localStorage.setItem('walletAddress', connectionResult.address);

      console.log('Wallet connected successfully with manual authorization:', connectionResult.address);
      
    } catch (error) {
      console.error('Manual wallet connection failed:', error);
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
    // Clear ALL stored data to prevent auto-reconnection
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
    
    setWalletState(initialState);
    console.log('Wallet disconnected and all cached data cleared');
  };

  // CRÍTICO: Eliminar auto-reconexión automática
  // Los usuarios deben autorizar manualmente cada sesión por seguridad
  useEffect(() => {
    console.log('WalletProvider initialized - NO auto-reconnection for security');
    // REMOVIDO: Auto-reconnection code para forzar autorización manual cada vez
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
