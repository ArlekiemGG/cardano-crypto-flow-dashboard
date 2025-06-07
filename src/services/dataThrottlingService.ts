
class DataThrottlingService {
  private lastFetchTimes: Map<string, number> = new Map();
  private readonly DEFAULT_COOLDOWN = 60000; // 1 minute

  canFetch(service: string, cooldownMs?: number): boolean {
    const cooldown = cooldownMs || this.DEFAULT_COOLDOWN;
    const lastFetch = this.lastFetchTimes.get(service) || 0;
    const now = Date.now();
    
    if (now - lastFetch >= cooldown) {
      this.lastFetchTimes.set(service, now);
      return true;
    }
    
    return false;
  }

  markFetched(service: string): void {
    this.lastFetchTimes.set(service, Date.now());
  }

  getRemainingCooldown(service: string, cooldownMs?: number): number {
    const cooldown = cooldownMs || this.DEFAULT_COOLDOWN;
    const lastFetch = this.lastFetchTimes.get(service) || 0;
    const elapsed = Date.now() - lastFetch;
    return Math.max(0, cooldown - elapsed);
  }

  reset(service?: string): void {
    if (service) {
      this.lastFetchTimes.delete(service);
    } else {
      this.lastFetchTimes.clear();
    }
  }
}

export const dataThrottlingService = new DataThrottlingService();
