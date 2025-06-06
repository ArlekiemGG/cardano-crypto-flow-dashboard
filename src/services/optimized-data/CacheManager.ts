
interface CacheEntry {
  data: any;
  timestamp: number;
  source: 'defillama' | 'native';
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL: number;

  constructor(ttl: number) {
    this.cacheTTL = ttl;
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry || !this.isValidCache(entry)) {
      return null;
    }
    return entry;
  }

  set(key: string, data: any, source: 'defillama' | 'native'): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      source
    });
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTTL;
  }

  clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.cacheTTL) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
  }

  getStats() {
    const total = this.cache.size;
    const valid = Array.from(this.cache.values()).filter(entry => 
      this.isValidCache(entry)
    ).length;
    
    const sources = Array.from(this.cache.values()).reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      valid,
      expired: total - valid,
      sources,
      hitRate: valid > 0 ? valid / total : 0
    };
  }
}
