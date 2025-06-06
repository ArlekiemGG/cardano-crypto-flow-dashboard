
export class DataThrottlingService {
  private lastFetchTimes = new Map<string, number>();
  private readonly THROTTLE_INTERVALS = {
    coinGecko: 60000, // 1 minuto
    defiLlama: 45000, // 45 segundos
    blockfrost: 30000, // 30 segundos
    arbitrage: 30000, // 30 segundos para escaneos
    marketData: 60000 // 1 minuto para datos de mercado
  };

  canFetch(source: keyof typeof this.THROTTLE_INTERVALS): boolean {
    const now = Date.now();
    const lastFetch = this.lastFetchTimes.get(source) || 0;
    const interval = this.THROTTLE_INTERVALS[source];
    
    if (now - lastFetch >= interval) {
      this.lastFetchTimes.set(source, now);
      return true;
    }
    
    console.log(`⏳ Throttling ${source}: ${Math.ceil((interval - (now - lastFetch)) / 1000)}s remaining`);
    return false;
  }

  getNextAllowedTime(source: keyof typeof this.THROTTLE_INTERVALS): number {
    const lastFetch = this.lastFetchTimes.get(source) || 0;
    const interval = this.THROTTLE_INTERVALS[source];
    return lastFetch + interval;
  }

  reset(source?: keyof typeof this.THROTTLE_INTERVALS): void {
    if (source) {
      this.lastFetchTimes.delete(source);
    } else {
      this.lastFetchTimes.clear();
    }
  }
}

export const dataThrottlingService = new DataThrottlingService();
