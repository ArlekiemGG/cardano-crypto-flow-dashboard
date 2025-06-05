
// Trading types for real Cardano DEX integration
export interface DEXPrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  lastUpdate: string;
}

export interface ArbitrageOpportunity {
  id: string;
  pair: string;
  dexA: string;
  dexB: string;
  priceA: number;
  priceB: number;
  profitPercentage: number;
  volume: number;
  confidence: 'High' | 'Medium' | 'Low';
  timestamp: string;
}

export interface TradingStrategy {
  id: string;
  name: string;
  type: 'DCA' | 'Grid' | 'MeanReversion' | 'Momentum';
  status: 'active' | 'paused' | 'stopped';
  pair: string;
  profit: number;
  trades: number;
  createdAt: string;
  config: Record<string, any>;
}

export interface PortfolioAsset {
  symbol: string;
  amount: number;
  value: number;
  allocation: number;
  change24h: number;
  priceUSD: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdate: string;
}
