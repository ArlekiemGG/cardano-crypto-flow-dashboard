
class DataThrottlingService {
  private lastFetchTimes: Map<string, number> = new Map();
  private readonly THROTTLE_INTERVALS = {
    arbitrage: 60000, // 1 minute
    orderbook: 30000, // 30 seconds
    charts: 45000,    // 45 seconds
    market: 20000     // 20 seconds
  };

  canFetch(dataType: keyof typeof this.THROTTLE_INTERVALS): boolean {
    const now = Date.now();
    const lastFetch = this.lastFetchTimes.get(dataType) || 0;
    const interval = this.THROTTLE_INTERVALS[dataType];
    
    if (now - lastFetch >= interval) {
      this.lastFetchTimes.set(dataType, now);
      console.log(`✅ Data fetch allowed for ${dataType}`);
      return true;
    }
    
    const timeLeft = Math.ceil((interval - (now - lastFetch)) / 1000);
    console.log(`⏳ Data fetch throttled for ${dataType}, ${timeLeft}s remaining`);
    return false;
  }

  getTimeUntilNextFetch(dataType: keyof typeof this.THROTTLE_INTERVALS): number {
    const now = Date.now();
    const lastFetch = this.lastFetchTimes.get(dataType) || 0;
    const interval = this.THROTTLE_INTERVALS[dataType];
    return Math.max(0, interval - (now - lastFetch));
  }

  reset(dataType?: keyof typeof this.THROTTLE_INTERVALS) {
    if (dataType) {
      this.lastFetchTimes.delete(dataType);
      console.log(`🔄 Reset throttling for ${dataType}`);
    } else {
      this.lastFetchTimes.clear();
      console.log('🔄 Reset all data throttling');
    }
  }
}

export const dataThrottlingService = new DataThrottlingService();
