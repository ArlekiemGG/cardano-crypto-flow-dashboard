
import { useState, useCallback } from 'react';
import { LucidEvolution } from '@lucid-evolution/lucid';
import { getWalletBalance } from '@/utils/lucidUtils';

export const useWalletBalance = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh balance using Lucid Evolution
  const refreshBalance = useCallback(async (
    lucid: LucidEvolution | null, 
    walletApi: any | null,
    isConnected: boolean
  ): Promise<number | null> => {
    if (!lucid || !isConnected) {
      console.log('No Lucid instance or not connected, skipping balance refresh');
      return null;
    }

    try {
      console.log('Refreshing balance...');
      setIsRefreshing(true);
      
      const balance = await getWalletBalance(lucid, walletApi);
      console.log('Balance updated:', balance, 'ADA');
      
      return balance;
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      throw new Error('Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Check minimum balance for premium access
  const checkMinimumBalance = useCallback((balance: number, minAda: number): boolean => {
    return balance >= minAda;
  }, []);

  return {
    isRefreshing,
    refreshBalance,
    checkMinimumBalance,
  };
};
