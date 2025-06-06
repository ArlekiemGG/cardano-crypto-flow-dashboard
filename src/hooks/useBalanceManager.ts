
import { useState, useEffect, useCallback } from 'react';
import type { WalletApi as CardanoWalletApi } from '@/types/cardano';
import { lovelaceToAda } from '@/utils/walletUtils';

interface BalanceState {
  balance: number;
  utxos: any[];
}

export const useBalanceManager = (walletApi: CardanoWalletApi | null, isConnected: boolean) => {
  const [balanceState, setBalanceState] = useState<BalanceState>({
    balance: 0,
    utxos: [],
  });

  // Refresh balance
  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!walletApi || !isConnected) return;

    try {
      const balanceHex = await walletApi.getBalance();
      const balance = lovelaceToAda(balanceHex);

      const utxosHex = await walletApi.getUtxos();
      const utxos = utxosHex || [];

      setBalanceState({ balance, utxos });

      console.log('Balance refreshed:', balance, 'ADA');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [walletApi, isConnected]);

  // Check minimum balance for premium access
  const checkMinimumBalance = useCallback((minAda: number): boolean => {
    return balanceState.balance >= minAda;
  }, [balanceState.balance]);

  // Refresh balance periodically
  useEffect(() => {
    if (isConnected && walletApi) {
      const interval = setInterval(refreshBalance, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, walletApi, refreshBalance]);

  // Update balance when wallet API changes
  useEffect(() => {
    if (walletApi && isConnected) {
      refreshBalance();
    }
  }, [walletApi, isConnected, refreshBalance]);

  return {
    ...balanceState,
    refreshBalance,
    checkMinimumBalance,
  };
};
