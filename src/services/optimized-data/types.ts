
export interface DeFiLlamaPrice {
  coins: Record<string, {
    price: number;
    symbol: string;
    timestamp: number;
    confidence: number;
  }>;
}

export interface DeFiLlamaProtocol {
  id: string;
  name: string;
  chains: string[];
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  volume_1d?: number;
}

export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  sources: Record<string, number>;
  hitRate: number;
}
