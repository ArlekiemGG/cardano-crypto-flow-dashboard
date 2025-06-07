
import { StateManager } from './StateManager';
import { MarketData } from '@/types/trading';

interface MarketDataState {
  marketData: MarketData[];
  isConnected: boolean;
  isLoading: boolean;
  lastUpdate: Date | null;
  errorMessage: string | null;
}

class MarketDataStateManager extends StateManager<MarketDataState> {
  constructor() {
    super({
      marketData: [],
      isConnected: false,
      isLoading: true,
      lastUpdate: null,
      errorMessage: null
    });
  }

  updateMarketData(data: MarketData[]): void {
    this.setState({
      marketData: data,
      lastUpdate: new Date(),
      isLoading: false,
      errorMessage: null
    });
  }

  setConnectionStatus(connected: boolean): void {
    this.setState({ isConnected: connected });
  }

  setLoading(loading: boolean): void {
    this.setState({ isLoading: loading });
  }

  setError(error: string | null): void {
    this.setState({ errorMessage: error });
  }

  getMarketDataBySymbol(symbol: string): MarketData | undefined {
    return this.getState().marketData.find(data => data.symbol === symbol);
  }

  getTopMarketDataByVolume(limit: number = 10): MarketData[] {
    return this.getState().marketData
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, limit);
  }
}

export const marketDataStateManager = new MarketDataStateManager();
