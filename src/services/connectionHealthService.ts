
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
    if (!prices || prices.length === 0) {
      this.connectionHealth = { blockfrost: false, defiLlama: false };
      return;
    }

    const dexSources = new Set(
      prices
        .map(p => p.dex?.toLowerCase() || '')
        .filter(source => source.length > 0)
    );
    
    this.connectionHealth = {
      blockfrost: dexSources.has('blockfrost'),
      defiLlama: dexSources.has('defillama')
    };

    console.log('🔍 Connection health updated from prices:', {
      sources: Array.from(dexSources),
      blockfrost: this.connectionHealth.blockfrost,
      defiLlama: this.connectionHealth.defiLlama,
      totalPrices: prices.length
    });
  }

  // Método adicional para verificar por timestamp de datos
  updateFromDatabaseData(data: any[]): void {
    if (!data || data.length === 0) {
      this.connectionHealth = { blockfrost: false, defiLlama: false };
      return;
    }

    const sources = new Set(
      data
        .map(item => item.source_dex?.toLowerCase() || '')
        .filter(source => source.length > 0)
    );

    this.connectionHealth = {
      blockfrost: sources.has('blockfrost'),
      defiLlama: sources.has('defillama')
    };

    console.log('📊 Connection health updated from database:', {
      sources: Array.from(sources),
      blockfrost: this.connectionHealth.blockfrost,
      defiLlama: this.connectionHealth.defiLlama,
      dataPoints: data.length
    });
  }

  getConnectionHealth(): ConnectionHealth {
    return { ...this.connectionHealth };
  }

  isConnected(): boolean {
    return Object.values(this.connectionHealth).some(Boolean);
  }

  getConnectedCount(): number {
    return Object.values(this.connectionHealth).filter(Boolean).length;
  }
}

export const connectionHealthService = new ConnectionHealthService();
