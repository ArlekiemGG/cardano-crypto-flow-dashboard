
import { LucidEvolution } from '@lucid-evolution/lucid';

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

export interface WalletContextType extends WalletState {
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => void;
  getAvailableWallets: () => string[];
  refreshBalance: () => Promise<void>;
  checkMinimumBalance: (minAda: number) => boolean;
  hasWallet: (walletName: string) => boolean;
}

export type SupportedWallet = 'eternl' | 'nami' | 'yoroi' | 'flint' | 'typhoncip30' | 'gerowallet' | 'brave';
