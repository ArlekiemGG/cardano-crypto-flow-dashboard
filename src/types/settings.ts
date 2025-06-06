
export interface NotificationSettings {
  tradeAlerts: boolean;
  arbitrageOpportunities: boolean;
  portfolioUpdates: boolean;
  systemMaintenance: boolean;
}

export interface TradingPreferences {
  defaultSlippage: number;
  maxGasFee: number;
  autoExecuteThreshold: number;
}

export interface UserProfile {
  email: string;
  username: string;
}

export interface SettingsData {
  profile?: UserProfile;
  notifications?: NotificationSettings;
  tradingPreferences?: TradingPreferences;
  walletName?: string;
  network?: string;
  lastUpdated?: string;
}
