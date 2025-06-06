
export interface DeFiLlamaPrice {
  price: number;
  change_24h?: number;
  volume_24h?: number;
  market_cap?: number;
  timestamp: string;
}

export interface DeFiLlamaProtocol {
  id: string;
  name: string;
  tvl: number;
  change_1d?: number;
  chains?: string[];
  lastUpdate?: string;
}

export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  sources: Record<string, number>;
  hitRate: number;
}
