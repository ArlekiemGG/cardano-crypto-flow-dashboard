
export interface ArbitrageOpportunityReal {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitPercentage: number;
  profitADA: number;
  volumeAvailable: number;
  totalFees: number;
  netProfit: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timeToExpiry: number;
  slippageRisk: number;
  liquidityScore: number;
  timestamp: string;
  executionReady?: boolean;
}

export interface DEXFeeStructure {
  dex: string;
  tradingFee: number;
  withdrawalFee: number;
  networkFee: number;
  minimumTrade: number;
}

export interface ExtendedMarketData {
  pair: string;
  dex: string;
  price: number;
  volume24h: number;
  liquidity: number;
}

export interface ArbitrageConfig {
  MIN_PROFIT_PERCENTAGE: number;
  MIN_VOLUME_ADA: number;
  MAX_SLIPPAGE: number;
  MIN_CONFIDENCE_FOR_AUTO_TRADES: string;
  MIN_PRICE_DIFFERENCE: number;
  SCAN_COOLDOWN: number;
}
