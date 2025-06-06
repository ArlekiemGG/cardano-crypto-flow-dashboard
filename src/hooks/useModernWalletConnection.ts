
import { LucidEvolution } from '@lucid-evolution/lucid';
import { 
  initializeLucid, 
  hasWallet, 
  convertAddress 
} from '@/utils/modernWalletUtils';

export const useModernWalletConnection = () => {
  // Connect to wallet using Lucid Evolution
  const connectWallet = async (walletName: string): Promise<{
    walletApi: any;
    lucid: LucidEvolution;
    address: string;
    balance: number;
  }> => {
    console.log(`=== CONNECTING TO ${walletName.toUpperCase()} WALLET ===`);

    // Check if wallet is available
    if (!hasWallet(walletName)) {
      throw new Error(`${walletName} wallet not found. Please install the wallet extension.`);
    }

    // Initialize Lucid
    const lucid = await initializeLucid();

    // Connect to wallet
    const walletApi = await window.cardano[walletName].enable();
    
    if (!walletApi) {
      throw new Error(`Failed to connect to ${walletName}. Please approve the connection.`);
    }

    // Select wallet in Lucid
    lucid.selectWallet.fromAPI(walletApi);

    // Get wallet address - try different methods
    let address = '';
    
    try {
      // Try Lucid's method first
      address = await lucid.wallet().address();
    } catch (error) {
      console.warn('Lucid address method failed, trying wallet API directly:', error);
      
      // Fallback to wallet API methods
      try {
        const usedAddresses = await walletApi.getUsedAddresses();
        if (usedAddresses && usedAddresses.length > 0) {
          address = convertAddress(usedAddresses[0]);
        }
      } catch (error) {
        console.warn('getUsedAddresses failed:', error);
      }
      
      if (!address) {
        try {
          const changeAddress = await walletApi.getChangeAddress();
          if (changeAddress) {
            address = convertAddress(changeAddress);
          }
        } catch (error) {
          console.warn('getChangeAddress failed:', error);
        }
      }
    }

    if (!address) {
      throw new Error('Could not retrieve wallet address. Please try reconnecting.');
    }

    console.log('Wallet address:', address);

    // Get initial balance
    let balance = 0;
    try {
      const utxos = await lucid.wallet().getUtxos();
      balance = utxos.reduce((total, utxo) => {
        return total + Number(utxo.assets.lovelace) / 1000000;
      }, 0);
    } catch (error) {
      console.warn('Failed to get balance from Lucid, trying wallet API:', error);
      
      try {
        const balanceHex = await walletApi.getBalance();
        balance = parseInt(balanceHex, 16) / 1000000;
      } catch (error) {
        console.warn('Failed to get balance from wallet API:', error);
        balance = 0; // Default to 0 if balance fetch fails
      }
    }

    console.log('Initial balance:', balance, 'ADA');
    console.log(`=== ${walletName.toUpperCase()} WALLET CONNECTED SUCCESSFULLY ===`);

    return {
      walletApi,
      lucid,
      address,
      balance,
    };
  };

  return {
    connectWallet,
  };
};
