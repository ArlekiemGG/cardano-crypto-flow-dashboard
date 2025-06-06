
export interface RealMarketMakingPosition {
  id: string;
  pair: string;
  dex: string;
  liquidityProvided: number;
  currentSpread: number;
  volume24h: number;
  feesEarned: number;
  impermanentLoss: number;
  apy: number;
  status: 'active' | 'paused';
  tokenAAmount: number;
  tokenBAmount: number;
  entryPriceA: number;
  entryPriceB: number;
  poolAddress?: string;
  lpTokenAmount?: number;
  lastRebalance?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PositionCreationParams {
  pair: string;
  dex: string;
  tokenAAmount: number;
  tokenBAmount: number;
  priceA: number;
  priceB: number;
}
