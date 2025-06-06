
import { connectionHealthService } from './connectionHealthService';
import { subscriptionManagerService } from './subscriptionManagerService';
import { dataFetchingService } from './dataFetchingService';
import { intervalManagerService } from './intervalManagerService';

interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

export class RealTimeMarketDataService {
  private isRunning = false;
  private currentPrices: RealTimePrice[] = [];
  private readonly UPDATE_INTERVAL = 45000; // 45 seconds for simplified architecture

  private debouncedFetch = this.debounce(this.performFetch.bind(this), 3000);

  private debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  async startRealTimeUpdates(intervalSeconds: number = 45): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Simplified real-time updates already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting simplified real-time updates (Blockfrost + DeFiLlama only)...');

    // Initial fetch
    this.debouncedFetch();

    // Set up periodic updates
    const updateIntervalMs = Math.max(intervalSeconds * 1000, this.UPDATE_INTERVAL);
    intervalManagerService.startUpdateInterval(() => {
      if (dataFetchingService.canFetch()) {
        this.debouncedFetch();
      }
    }, updateIntervalMs);

    console.log(`✅ Simplified updates started with ${Math.max(intervalSeconds, 45)}s interval`);
  }

  private async performFetch(): Promise<void> {
    try {
      const allPrices = await dataFetchingService.fetchSimplifiedData();

      if (allPrices.length > 0) {
        // Update connection health
        connectionHealthService.updateConnectionHealth(allPrices);

        // Update current prices and notify subscribers
        this.currentPrices = allPrices;
        subscriptionManagerService.notifySubscribers(allPrices);

        // Reset retry count on successful fetch
        intervalManagerService.resetRetryCount();
      }
    } catch (error) {
      console.error('❌ Error in performFetch:', error);
      this.handleUpdateError();
    }
  }

  private handleUpdateError(): void {
    const shouldReconnect = intervalManagerService.incrementRetryCount();

    if (shouldReconnect) {
      console.log('🔄 Max retries reached, scheduling reconnection...');
      intervalManagerService.scheduleReconnect(() => this.performFetch());
    }
  }

  stopRealTimeUpdates(): void {
    if (!this.isRunning) return;

    console.log('🛑 Stopping simplified real-time updates...');
    this.isRunning = false;

    intervalManagerService.cleanup();
    subscriptionManagerService.clearSubscribers();

    console.log('✅ Simplified updates stopped');
  }

  subscribe(callback: (data: RealTimePrice[]) => void): () => void {
    const unsubscribe = subscriptionManagerService.subscribe(callback);
    
    if (this.currentPrices.length > 0) {
      callback(this.currentPrices);
    }

    return unsubscribe;
  }

  getCurrentPrices(): RealTimePrice[] {
    return [...this.currentPrices];
  }

  getDEXPrices(dexName: string): RealTimePrice[] {
    return this.currentPrices.filter(price => 
      price.dex.toLowerCase() === dexName.toLowerCase()
    );
  }

  getPairPrices(pairName: string): RealTimePrice[] {
    return this.currentPrices.filter(price => 
      price.pair.toLowerCase().includes(pairName.toLowerCase())
    );
  }

  isConnected(): boolean {
    return this.isRunning && this.currentPrices.length > 0;
  }

  getConnectionHealth() {
    return connectionHealthService.getConnectionHealth();
  }

  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing simplified data...');
    dataFetchingService.resetFetchTime();
    await this.performFetch();
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
