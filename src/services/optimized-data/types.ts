
export interface DeFiLlamaProtocol {
  id: string;
  name: string;
  url: string;
  description?: string;
  chains: string[];
  tvl: number;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  category?: string;
}

export interface DeFiLlamaPrice {
  price: number;
  symbol: string;
  timestamp: number;
  confidence?: number;
}

export interface DeFiLlamaPriceResponse {
  coins: Record<string, DeFiLlamaPrice>;
}

export interface CacheStats {
  lastUpdate: Date;
  hitRate: number;
  missRate: number;
  totalRequests?: number;
  cacheSize?: number;
}

export interface MarketDataEntry {
  pair: string;
  price: number;
  volume24h: number;
  change24h?: number;
  source: string;
  timestamp: string;
}
