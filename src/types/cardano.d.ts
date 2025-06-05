
interface CardanoWalletApi {
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
  experimental?: {
    [key: string]: any;
  };
}

interface WalletApi {
  getNetworkId(): Promise<number>;
  getUtxos(): Promise<string[] | undefined>;
  getBalance(): Promise<string>;
  getUsedAddresses(): Promise<string[]>;
  getUnusedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getRewardAddresses(): Promise<string[]>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  signData(address: string, payload: string): Promise<string>;
  submitTx(tx: string): Promise<string>;
  getCollateral?(): Promise<string[]>;
  experimental?: {
    [key: string]: any;
  };
}

interface Cardano {
  [walletName: string]: CardanoWalletApi;
  nami?: CardanoWalletApi;
  eternl?: CardanoWalletApi;
  flint?: CardanoWalletApi;
  vespr?: CardanoWalletApi;
  yoroi?: CardanoWalletApi;
  gerowallet?: CardanoWalletApi;
  nufi?: CardanoWalletApi;
}

declare global {
  interface Window {
    cardano?: Cardano;
  }
}

export {};
