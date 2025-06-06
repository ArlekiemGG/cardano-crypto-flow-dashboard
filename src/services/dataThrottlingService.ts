
export class DataThrottlingService {
  private lastFetchTimes = new Map<string, number>();
  private readonly THROTTLE_INTERVALS = {
    coinGecko: 45000, // 45 segundos (reducido)
    defiLlama: 30000, // 30 segundos (reducido)
    blockfrost: 20000, // 20 segundos (reducido)
    arbitrage: 15000, // 15 segundos (reducido significativamente)
    marketData: 30000 // 30 segundos (reducido)
  };

  canFetch(source: keyof typeof this.THROTTLE_INTERVALS): boolean {
    const now = Date.now();
    const lastFetch = this.lastFetchTimes.get(source) || 0;
    const interval = this.THROTTLE_INTERVALS[source];
    
    if (now - lastFetch >= interval) {
      this.lastFetchTimes.set(source, now);
      return true;
    }
    
    const remaining = Math.ceil((interval - (now - lastFetch)) / 1000);
    console.log(`⏳ Throttling ${source}: ${remaining}s remaining`);
    return false;
  }

  // Forzar reset para testing
  forceReset(source?: keyof typeof this.THROTTLE_INTERVALS): void {
    if (source) {
      this.lastFetchTimes.delete(source);
      console.log(`🔄 Forced reset for ${source}`);
    } else {
      this.lastFetchTimes.clear();
      console.log(`🔄 Forced reset for all sources`);
    }
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
