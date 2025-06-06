interface AdvancedCacheEntry {
  data: any;
  timestamp: number;
  source: 'defillama' | 'native' | 'blockfrost' | 'coingecko';
  accessCount: number;
  lastAccessed: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  compressionLevel: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  averageAccessTime: number;
  memoryUsage: number;
  compressionRatio: number;
}

export class AdvancedCacheManager {
  private cache = new Map<string, AdvancedCacheEntry>();
  private readonly maxSize: number;
  private readonly cacheTTL: number;
  private readonly compressionThreshold: number;
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;
  private accessTimes: number[] = [];

  constructor(maxSize: number = 1000, ttl: number = 5 * 60 * 1000, compressionThreshold: number = 10000) {
    this.maxSize = maxSize;
    this.cacheTTL = ttl;
    this.compressionThreshold = compressionThreshold;

    // Cleanup expired entries every 2 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 2 * 60 * 1000);

    // Memory pressure cleanup every 10 minutes
    setInterval(() => {
      this.handleMemoryPressure();
    }, 10 * 60 * 1000);
  }

  get(key: string): any | null {
    const startTime = performance.now();
    const entry = this.cache.get(key);
    
    if (!entry || !this.isValidCache(entry)) {
      this.missCount++;
      this.recordAccessTime(performance.now() - startTime);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hitCount++;
    this.recordAccessTime(performance.now() - startTime);

    // Decompress if needed
    const data = this.isCompressed(entry) ? this.decompress(entry.data) : entry.data;
    
    console.log(`✅ Advanced cache hit for key: ${key} (accessed ${entry.accessCount} times)`);
    return data;
  }

  set(key: string, data: any, source: 'defillama' | 'native' | 'blockfrost' | 'coingecko', priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'): void {
    // Handle cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    // Compress large data
    const serializedData = JSON.stringify(data);
    const shouldCompress = serializedData.length > this.compressionThreshold;
    const finalData = shouldCompress ? this.compress(serializedData) : data;

    const entry: AdvancedCacheEntry = {
      data: finalData,
      timestamp: Date.now(),
      source,
      accessCount: 0,
      lastAccessed: Date.now(),
      priority,
      compressionLevel: shouldCompress ? 1 : 0
    };

    this.cache.set(key, entry);
    console.log(`💾 Advanced cache set: ${key} (source: ${source}, priority: ${priority}, compressed: ${shouldCompress})`);
  }

  private isValidCache(entry: AdvancedCacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    
    // Priority-based TTL adjustment
    const adjustedTTL = this.getAdjustedTTL(entry.priority);
    
    return age < adjustedTTL;
  }

  private getAdjustedTTL(priority: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (priority) {
      case 'HIGH': return this.cacheTTL * 2; // Cache HIGH priority items longer
      case 'MEDIUM': return this.cacheTTL;
      case 'LOW': return this.cacheTTL * 0.5; // Cache LOW priority items shorter
    }
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedEntry: AdvancedCacheEntry | null = null;
    let lowestScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Calculate eviction score (lower = more likely to evict)
      const age = Date.now() - entry.lastAccessed;
      const priorityWeight = entry.priority === 'HIGH' ? 0.3 : entry.priority === 'MEDIUM' ? 0.6 : 1.0;
      const accessWeight = Math.max(1, entry.accessCount);
      
      const evictionScore = (age / accessWeight) * priorityWeight;
      
      if (evictionScore < lowestScore) {
        lowestScore = evictionScore;
        leastUsedKey = key;
        leastUsedEntry = entry;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.evictionCount++;
      console.log(`🗑️ Evicted cache entry: ${leastUsedKey} (score: ${lowestScore.toFixed(2)})`);
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidCache(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Advanced cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  private handleMemoryPressure(): void {
    const memoryUsage = this.getMemoryUsage();
    
    // If memory usage is high, aggressively clean low-priority items
    if (memoryUsage > 50 * 1024 * 1024) { // 50MB threshold
      console.log(`⚠️ Memory pressure detected (${(memoryUsage / 1024 / 1024).toFixed(2)}MB), cleaning low-priority items`);
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.priority === 'LOW' && entry.accessCount < 3) {
          this.cache.delete(key);
          this.evictionCount++;
        }
      }
    }
  }

  private compress(data: string): string {
    // Simple compression simulation (in real app, use actual compression library)
    return `COMPRESSED:${data.length}:${btoa(data)}`;
  }

  private decompress(compressedData: string): any {
    if (typeof compressedData === 'string' && compressedData.startsWith('COMPRESSED:')) {
      const parts = compressedData.split(':');
      const originalData = atob(parts[2]);
      return JSON.parse(originalData);
    }
    return compressedData;
  }

  private isCompressed(entry: AdvancedCacheEntry): boolean {
    return entry.compressionLevel > 0;
  }

  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    
    // Keep only last 1000 access times for averaging
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-1000);
    }
  }

  private getMemoryUsage(): number {
    // Estimate memory usage of cache
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const keySize = key.length * 2; // UTF-16
      const dataSize = JSON.stringify(entry).length * 2;
      totalSize += keySize + dataSize;
    }
    
    return totalSize;
  }

  getAdvancedStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    const missRate = total > 0 ? this.missCount / total : 0;
    const averageAccessTime = this.accessTimes.length > 0 
      ? this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length 
      : 0;
    
    const memoryUsage = this.getMemoryUsage();
    const compressedEntries = Array.from(this.cache.values()).filter(entry => entry.compressionLevel > 0).length;
    const compressionRatio = this.cache.size > 0 ? compressedEntries / this.cache.size : 0;

    return {
      totalEntries: this.cache.size,
      hitRate,
      missRate,
      evictionCount: this.evictionCount,
      averageAccessTime,
      memoryUsage,
      compressionRatio
    };
  }

  // Preload critical data
  async preloadCriticalData(dataLoader: (key: string) => Promise<any>): Promise<void> {
    const criticalKeys = [
      'prices:coingecko:cardano',
      'cardano-protocols',
      'cardano-dex-volumes'
    ];

    console.log('🚀 Preloading critical data...');
    
    const preloadPromises = criticalKeys.map(async (key) => {
      try {
        const data = await dataLoader(key);
        this.set(key, data, 'defillama', 'HIGH');
      } catch (error) {
        console.error(`❌ Failed to preload ${key}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('✅ Critical data preload completed');
  }

  // Get cache health score (0-100)
  getHealthScore(): number {
    const stats = this.getAdvancedStats();
    
    const hitRateScore = stats.hitRate * 40; // 40 points max
    const memoryScore = Math.max(0, 30 - (stats.memoryUsage / 1024 / 1024)); // 30 points max, decreases with memory usage
    const accessTimeScore = Math.max(0, 20 - stats.averageAccessTime); // 20 points max, decreases with access time
    const evictionScore = Math.max(0, 10 - (stats.evictionCount / 100)); // 10 points max
    
    return Math.min(100, hitRateScore + memoryScore + accessTimeScore + evictionScore);
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.accessTimes = [];
    console.log('🧹 Advanced cache cleared');
  }
}
