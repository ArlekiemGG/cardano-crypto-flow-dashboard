
export class DataThrottlingService {
  private lastFetchTimes = new Map<string, number>();
  private readonly THROTTLE_INTERVALS = {
    coinGecko: 45000, // Reducido de 60s a 45s
    defiLlama: 30000, // Reducido de 45s a 30s
    blockfrost: 20000, // Reducido de 30s a 20s
    arbitrage: 15000, // Reducido de 30s a 15s para capturar más oportunidades
    marketData: 30000 // Reducido de 60s a 30s para datos más frescos
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

  // Nuevo método para verificar el estado del throttling
  getThrottlingStatus(): Record<string, { canFetch: boolean; nextAllowedIn: number }> {
    const now = Date.now();
    const status: Record<string, { canFetch: boolean; nextAllowedIn: number }> = {};
    
    Object.keys(this.THROTTLE_INTERVALS).forEach((source) => {
      const key = source as keyof typeof this.THROTTLE_INTERVALS;
      const lastFetch = this.lastFetchTimes.get(key) || 0;
      const interval = this.THROTTLE_INTERVALS[key];
      const nextAllowed = lastFetch + interval;
      
      status[source] = {
        canFetch: now >= nextAllowed,
        nextAllowedIn: Math.max(0, nextAllowed - now)
      };
    });
    
    return status;
  }
}

export const dataThrottlingService = new DataThrottlingService();
