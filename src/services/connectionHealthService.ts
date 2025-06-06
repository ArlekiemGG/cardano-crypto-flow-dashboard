
interface ConnectionHealth {
  blockfrost: boolean;
  defiLlama: boolean;
}

interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

export class ConnectionHealthService {
  private connectionHealth: ConnectionHealth = {
    blockfrost: false,
    defiLlama: false
  };

  updateConnectionHealth(prices: RealTimePrice[]): void {
    const dexSources = new Set(prices.map(p => p.dex.toLowerCase()));
    
    this.connectionHealth = {
      blockfrost: dexSources.has('blockfrost'),
      defiLlama: dexSources.has('defillama')
    };
  }

  getConnectionHealth(): ConnectionHealth {
    return { ...this.connectionHealth };
  }

  isConnected(): boolean {
    return Object.values(this.connectionHealth).some(Boolean);
  }
}

export const connectionHealthService = new ConnectionHealthService();
