
// Enhanced Cardano wallet types for real integration

interface CardanoWalletApi {
  enable(): Promise<CardanoWalletApiInstance>;
  isEnabled(): Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
  experimental?: {
    disconnect?: () => Promise<void>;
    [key: string]: any;
  };
}

export interface CardanoWalletApiInstance {
  getNetworkId(): Promise<number>;
  getUtxos(amount?: string, paginate?: { page: number; limit: number }): Promise<string[] | undefined>;
  getBalance(): Promise<string>;
  getUsedAddresses(paginate?: { page: number; limit: number }): Promise<string[]>;
  getUnusedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getRewardAddresses(): Promise<string[]>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  signData(address: string, payload: string): Promise<{ signature: string; key: string; } | string>;
  submitTx(tx: string): Promise<string>;
  getCollateral?(amount?: string): Promise<string[]>;
  experimental?: {
    getCollateral?(amount?: string): Promise<string[]>;
    [key: string]: any;
  };
}

// Main WalletApi interface
export interface WalletApi extends CardanoWalletApiInstance {}

// Enhanced Cardano interface with better wallet detection
interface Cardano {
  [walletName: string]: CardanoWalletApi | undefined;
  nami?: CardanoWalletApi;
  eternl?: CardanoWalletApi;
  flint?: CardanoWalletApi;
  vespr?: CardanoWalletApi;
  yoroi?: CardanoWalletApi;
  gerowallet?: CardanoWalletApi;
  nufi?: CardanoWalletApi;
  typhoncip30?: CardanoWalletApi;
  cardwallet?: CardanoWalletApi;
}

// Additional types for wallet features
export interface WalletCapabilities {
  hasStaking: boolean;
  hasCollateral: boolean;
  hasMultiAsset: boolean;
  hasScriptSupport: boolean;
}

export interface WalletInfo {
  name: string;
  icon: string;
  version: string;
  capabilities: WalletCapabilities;
}

// Network types
export type NetworkType = 'Mainnet' | 'Testnet';

// Address types
export interface AddressInfo {
  address: string;
  type: 'payment' | 'stake' | 'script';
  network: NetworkType;
}

// UTXO types
export interface UTxO {
  txHash: string;
  outputIndex: number;
  amount: Array<{
    unit: string;
    quantity: string;
  }>;
  address: string;
  dataHash?: string;
}

declare global {
  interface Window {
    cardano?: Cardano;
  }
}

export {};
