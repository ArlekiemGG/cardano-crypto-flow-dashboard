// Modern Cardano wallet types for 2025 integration with Lucid Evolution

export interface ModernCardanoWalletApi {
  enable(): Promise<ModernWalletApiInstance>;
  isEnabled(): Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
  experimental?: {
    disconnect?: () => Promise<void>;
    [key: string]: any;
  };
}

export interface ModernWalletApiInstance {
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

// Modern Cardano interface with 2025 wallet support - AGREGADO VESPR
interface ModernCardano {
  [walletName: string]: ModernCardanoWalletApi | undefined;
  eternl?: ModernCardanoWalletApi;
  nami?: ModernCardanoWalletApi;
  yoroi?: ModernCardanoWalletApi;
  flint?: ModernCardanoWalletApi;
  typhoncip30?: ModernCardanoWalletApi;
  gerowallet?: ModernCardanoWalletApi;
  brave?: ModernCardanoWalletApi;
  vespr?: ModernCardanoWalletApi;
}

// Wallet capabilities for modern features
export interface ModernWalletCapabilities {
  hasStaking: boolean;
  hasCollateral: boolean;
  hasMultiAsset: boolean;
  hasScriptSupport: boolean;
  hasLucidSupport: boolean;
}

export interface ModernWalletInfo {
  name: string;
  icon: string;
  version: string;
  capabilities: ModernWalletCapabilities;
}

// Network types for 2025
export type ModernNetworkType = 'Mainnet' | 'Testnet';

// Address types for modern Cardano
export interface ModernAddressInfo {
  address: string;
  type: 'payment' | 'stake' | 'script';
  network: ModernNetworkType;
  bech32: string;
}

// Modern UTXO types
export interface ModernUTxO {
  txHash: string;
  outputIndex: number;
  assets: {
    [unit: string]: bigint;
  };
  address: string;
  datumHash?: string;
  datum?: string;
  scriptRef?: string;
}

declare global {
  interface Window {
    cardano?: ModernCardano;
  }
}

export {};
