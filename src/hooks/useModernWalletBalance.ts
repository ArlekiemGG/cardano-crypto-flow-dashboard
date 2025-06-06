
import { useEffect } from 'react';
import { LucidEvolution } from '@lucid-evolution/lucid';

export const useModernWalletBalance = (
  lucid: LucidEvolution | null,
  walletApi: any | null,
  isConnected: boolean,
  updateWalletState: (updates: any) => void
) => {
  // Refresh balance using Lucid Evolution
  const refreshBalance = async (): Promise<void> => {
    if (!lucid || !isConnected) {
      console.log('No Lucid instance or not connected, skipping balance refresh');
      return;
    }

    try {
      console.log('Refreshing balance...');
      
      let balance = 0;
      
      try {
        const utxos = await lucid.wallet().getUtxos();
        balance = utxos.reduce((total, utxo) => {
          return total + Number(utxo.assets.lovelace) / 1000000;
        }, 0);
      } catch (error) {
        console.warn('Failed to refresh balance via Lucid, trying wallet API:', error);
        
        if (walletApi) {
          try {
            const balanceHex = await walletApi.getBalance();
            balance = parseInt(balanceHex, 16) / 1000000;
          } catch (error) {
            console.warn('Failed to refresh balance via wallet API:', error);
          }
        }
      }

      updateWalletState({
        balance,
        lastUpdate: new Date(),
      });

      console.log('Balance updated:', balance, 'ADA');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      updateWalletState({
        error: 'Failed to refresh balance',
      });
    }
  };

  // Auto-refresh balance every 30 seconds only when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, lucid]);

  return {
    refreshBalance,
  };
};
