
// Wallet configuration constants for 2025
export const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';
export const BLOCKFROST_PROJECT_ID = 'mainnetqDbcAxZGzm4fvd6efh43cp81lL1VK6TT';
export const CARDANO_NETWORK = 'Mainnet';

// Supported wallets for 2025
export const SUPPORTED_WALLETS = [
  'eternl', 
  'nami', 
  'yoroi', 
  'flint', 
  'typhoncip30', 
  'gerowallet', 
  'brave'
] as const;

// Balance refresh interval (30 seconds)
export const BALANCE_REFRESH_INTERVAL = 30000;

// Minimum ADA for premium access
export const DEFAULT_MINIMUM_BALANCE = 100;
