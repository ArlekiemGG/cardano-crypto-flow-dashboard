
import { useState, useEffect, useCallback } from 'react';
import type { WalletApi as CardanoWalletApi } from '@/types/cardano';
import { blockfrostService } from '@/services/blockfrostService';

interface BalanceState {
  balance: number;
  utxos: any[];
}

export const useBalanceManager = (walletApi: CardanoWalletApi | null, isConnected: boolean, address: string | null) => {
  const [balanceState, setBalanceState] = useState<BalanceState>({
    balance: 0,
    utxos: [],
  });

  // Refresh balance using real Blockfrost data
  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!address || !isConnected) {
      console.log('No address or not connected, skipping balance refresh');
      return;
    }

    try {
      console.log('Refreshing balance for address:', address);
      
      // Get real address info from Blockfrost (currently mock implementation)
      const addressInfo = await blockfrostService.getAddressInfo(address);
      const balance = blockfrostService.getAdaBalance(addressInfo);

      // Get real UTXOs from Blockfrost (currently mock implementation)
      const utxos = await blockfrostService.getAddressUtxos(address);

      setBalanceState({ balance, utxos });

      console.log('Balance from Blockfrost (mock):', balance, 'ADA');
      console.log('UTXOs count:', utxos.length);
    } catch (error) {
      console.error('Failed to refresh balance from Blockfrost:', error);
      // Set balance to 0 on error to avoid showing fake data
      setBalanceState({ balance: 0, utxos: [] });
    }
  }, [address, isConnected]);

  // Check minimum balance for premium access
  const checkMinimumBalance = useCallback((minAda: number): boolean => {
    return balanceState.balance >= minAda;
  }, [balanceState.balance]);

  // Refresh balance periodically
  useEffect(() => {
    if (isConnected && address) {
      const interval = setInterval(refreshBalance, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, address, refreshBalance]);

  // Update balance when address changes
  useEffect(() => {
    if (address && isConnected) {
      refreshBalance();
    }
  }, [address, isConnected, refreshBalance]);

  return {
    ...balanceState,
    refreshBalance,
    checkMinimumBalance,
  };
};
