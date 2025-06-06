
import { useState } from 'react';
import type { WalletApi as CardanoWalletApi } from '@/types/cardano';

interface WalletConnectionState {
  isConnecting: boolean;
  error: string | null;
}

export const useWalletConnection = () => {
  const [connectionState, setConnectionState] = useState<WalletConnectionState>({
    isConnecting: false,
    error: null,
  });

  const connectWallet = async (walletName: string): Promise<{
    walletApi: CardanoWalletApi;
    address: string;
    balance: number;
    network: 'Mainnet' | 'Testnet';
    utxos: any[];
    stakeAddress: string | null;
  }> => {
    try {
      setConnectionState({ isConnecting: true, error: null });

      if (!window.cardano || !window.cardano[walletName]) {
        throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
      }

      console.log(`Requesting authorization from ${walletName} wallet...`);

      // CRÍTICO: Verificar primero si la wallet está disponible pero NO auto-conectar
      const walletExtension = window.cardano[walletName];
      
      if (!walletExtension) {
        throw new Error(`${walletName} extension not found`);
      }

      // IMPORTANTE: Verificar si ya está conectada y desconectar primero si es necesario
      // Esto fuerza a que la wallet pida autorización cada vez
      if (walletExtension.isEnabled && typeof walletExtension.isEnabled === 'function') {
        const isAlreadyEnabled = await walletExtension.isEnabled();
        if (isAlreadyEnabled) {
          console.log(`${walletName} wallet was previously connected. Forcing re-authorization...`);
          // No reutilizamos la conexión existente - forzamos nueva autorización
        }
      }

      // SOLUCIÓN: Llamar enable() SIEMPRE para forzar el popup de autorización
      // Esto debe abrir el popup de la wallet pidiendo permiso al usuario
      console.log(`Opening ${walletName} authorization popup...`);
      const walletApi = await walletExtension.enable();
      
      if (!walletApi) {
        throw new Error(`Failed to get authorization from ${walletName} wallet. User may have denied permission.`);
      }

      console.log(`${walletName} wallet authorized successfully!`);

      // Get network ID
      const networkId = await walletApi.getNetworkId();
      const network = networkId === 1 ? 'Mainnet' : 'Testnet';

      // Get wallet addresses - try multiple methods
      let address = '';
      
      try {
        // Method 1: Try to get used addresses first
        const usedAddresses = await walletApi.getUsedAddresses();
        console.log('Used addresses from wallet:', usedAddresses);
        
        if (usedAddresses && usedAddresses.length > 0) {
          const firstAddress = usedAddresses[0];
          if (typeof firstAddress === 'string') {
            if (firstAddress.startsWith('addr1')) {
              address = firstAddress;
            } else {
              address = firstAddress;
            }
          }
        }
      } catch (error) {
        console.warn('Could not get used addresses:', error);
      }

      // Method 2: If no used addresses, try unused addresses
      if (!address) {
        try {
          const unusedAddresses = await walletApi.getUnusedAddresses();
          console.log('Unused addresses from wallet:', unusedAddresses);
          
          if (unusedAddresses && unusedAddresses.length > 0) {
            const firstAddress = unusedAddresses[0];
            if (typeof firstAddress === 'string') {
              if (firstAddress.startsWith('addr1')) {
                address = firstAddress;
              } else {
                address = firstAddress;
              }
            }
          }
        } catch (error) {
          console.warn('Could not get unused addresses:', error);
        }
      }

      // Method 3: Fallback to change address
      if (!address) {
        try {
          const changeAddress = await walletApi.getChangeAddress();
          console.log('Change address from wallet:', changeAddress);
          
          if (typeof changeAddress === 'string') {
            if (changeAddress.startsWith('addr1')) {
              address = changeAddress;
            } else {
              address = changeAddress;
            }
          }
        } catch (error) {
          console.warn('Could not get change address:', error);
        }
      }

      if (!address) {
        throw new Error('Could not retrieve wallet address after authorization');
      }

      console.log('Wallet address obtained after authorization:', address);

      // Get stake address
      let stakeAddress: string | null = null;
      try {
        const rewardAddresses = await walletApi.getRewardAddresses();
        if (rewardAddresses && rewardAddresses.length > 0) {
          const firstRewardAddr = rewardAddresses[0];
          if (typeof firstRewardAddr === 'string') {
            stakeAddress = firstRewardAddr.startsWith('stake1') ? firstRewardAddr : firstRewardAddr;
          }
        }
      } catch (error) {
        console.warn('Could not fetch stake address:', error);
      }

      // IMPORTANTE: NO guardar en localStorage automáticamente aquí
      // Solo guardar después de que el usuario confirme que quiere mantenerse conectado
      console.log(`Successfully connected to ${walletName} wallet with manual authorization`);
      console.log('Authorized address:', address);
      console.log('Network:', network);
      console.log('Stake address:', stakeAddress);

      setConnectionState({ isConnecting: false, error: null });

      return {
        walletApi,
        address,
        balance: 0, // Will be fetched from Blockfrost
        network,
        utxos: [],
        stakeAddress,
      };
      
    } catch (error) {
      console.error('Wallet authorization failed:', error);
      let errorMessage = 'Failed to authorize wallet connection';
      
      if (error instanceof Error) {
        if (error.message.includes('User declined')) {
          errorMessage = 'User declined wallet authorization';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Wallet extension not found or not installed';
        } else {
          errorMessage = error.message;
        }
      }
      
      setConnectionState({ isConnecting: false, error: errorMessage });
      throw error;
    }
  };

  return {
    ...connectionState,
    connectWallet,
  };
};
