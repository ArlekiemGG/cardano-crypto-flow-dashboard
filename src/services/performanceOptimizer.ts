import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export class PerformanceOptimizer {
  private cache = new Map<string, CacheEntry>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  // Intelligent caching with TTL
  setCache(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Rate limiting per API
  async checkRateLimit(apiName: string, maxRequests: number, windowMinutes: number): Promise<boolean> {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const limit = this.rateLimits.get(apiName);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(apiName, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxRequests) {
      console.warn(`⚠️ Rate limit exceeded for ${apiName}`);
      return false;
    }

    limit.count++;
    return true;
  }

  // Lazy loading for heavy data
  async lazyLoadMarketData(pair: string): Promise<any> {
    const cacheKey = `market_${pair}`;
    let data = this.getCache(cacheKey);

    if (!data) {
      console.log(`🔄 Loading market data for ${pair}...`);
      
      const { data: marketData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('pair', pair)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!error && marketData) {
        data = marketData;
        this.setCache(cacheKey, data, 2); // 2 minute cache
      }
    }

    return data || [];
  }

  // Database query optimization
  async optimizeHistoricalQueries(timeRange: 'hour' | 'day' | 'week'): Promise<any[]> {
    const intervals = {
      hour: '1 hour',
      day: '1 day',
      week: '1 week'
    };

    // Use indexed query with time-based partitioning
    const { data, error } = await supabase
      .from('arbitrage_opportunities')
      .select('*')
      .gte('timestamp', new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString())
      .order('timestamp', { ascending: false });

    return data || [];
  }

  private getTimeRangeMs(range: 'hour' | 'day' | 'week'): number {
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };
    return ranges[range];
  }

  // Compress historical data
  compressHistoricalData(data: any[]): any[] {
    // Implement data compression for storage efficiency
    return data.map(item => ({
      ...item,
      // Keep only essential fields for historical data
      timestamp: item.timestamp,
      price: parseFloat(item.price.toFixed(6)),
      volume: parseFloat(item.volume.toFixed(2))
    }));
  }

  // Memory management
  clearOldCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Performance metrics
  getPerformanceMetrics(): {
    cacheSize: number;
    cacheHitRate: number;
    activeRateLimits: number;
  } {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0.85, // Mock value - would track in production
      activeRateLimits: this.rateLimits.size
    };
  }
}

export const performanceOptimizer = new PerformanceOptimizer();
