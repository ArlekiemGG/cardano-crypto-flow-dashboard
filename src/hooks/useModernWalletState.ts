
import { useState } from 'react';
import { LucidEvolution } from '@lucid-evolution/lucid';
import { CARDANO_NETWORK } from '@/utils/modernWalletUtils';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletName: string | null;
  walletApi: any | null;
  lucid: LucidEvolution | null;
  address: string | null;
  balance: number;
  network: string;
  error: string | null;
  lastUpdate: Date | null;
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

export const useModernWalletState = () => {
  const [walletState, setWalletState] = useState<WalletState>(initialState);

  const updateWalletState = (updates: Partial<WalletState>) => {
    setWalletState(prev => ({ ...prev, ...updates }));
  };

  const resetWalletState = () => {
    setWalletState(initialState);
  };

  return {
    walletState,
    updateWalletState,
    resetWalletState,
    initialState,
  };
};
