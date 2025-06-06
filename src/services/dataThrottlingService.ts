
class DataThrottlingService {
  private lastFetchTimes: Map<string, number> = new Map();
  private minIntervals: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private windowStart: number = Date.now();
  private readonly WINDOW_SIZE = 60000; // 1 minuto
  private readonly MAX_REQUESTS_PER_WINDOW = 8; // Reducido para evitar spam

  constructor() {
    // Intervalos optimizados
    this.minIntervals.set('arbitrage', 30000); // 30 segundos
    this.minIntervals.set('marketData', 60000); // 1 minuto
    this.minIntervals.set('defiLlama', 180000); // 3 minutos
    this.minIntervals.set('portfolio', 300000); // 5 minutos
  }

  canFetch(serviceKey: string): boolean {
    const now = Date.now();
    
    // Reset window si ha pasado el tiempo
    if (now - this.windowStart > this.WINDOW_SIZE) {
      this.requestCounts.clear();
      this.windowStart = now;
    }

    // Check rate limiting por ventana
    const currentCount = this.requestCounts.get(serviceKey) || 0;
    if (currentCount >= this.MAX_REQUESTS_PER_WINDOW) {
      console.log(`⚠️ Rate limit alcanzado para ${serviceKey}: ${currentCount}/${this.MAX_REQUESTS_PER_WINDOW}`);
      return false;
    }

    // Check intervalo mínimo
    const lastFetch = this.lastFetchTimes.get(serviceKey) || 0;
    const minInterval = this.minIntervals.get(serviceKey) || 30000;
    const timeSinceLastFetch = now - lastFetch;

    const canFetch = timeSinceLastFetch >= minInterval;
    
    if (canFetch) {
      this.lastFetchTimes.set(serviceKey, now);
      this.requestCounts.set(serviceKey, currentCount + 1);
      console.log(`✅ Fetch permitido para ${serviceKey} (${timeSinceLastFetch}ms desde último)`);
    } else {
      const waitTime = minInterval - timeSinceLastFetch;
      console.log(`⏳ Throttling ${serviceKey}: esperar ${Math.round(waitTime/1000)}s más`);
    }

    return canFetch;
  }

  getThrottlingStatus() {
    const now = Date.now();
    const status: Record<string, any> = {};

    for (const [service, minInterval] of this.minIntervals.entries()) {
      const lastFetch = this.lastFetchTimes.get(service) || 0;
      const timeSinceLastFetch = now - lastFetch;
      const canFetch = timeSinceLastFetch >= minInterval;
      const requestCount = this.requestCounts.get(service) || 0;

      status[service] = {
        canFetch,
        lastFetch: new Date(lastFetch).toISOString(),
        timeSinceLastFetch,
        minInterval,
        requestCount,
        waitTime: canFetch ? 0 : minInterval - timeSinceLastFetch
      };
    }

    return status;
  }

  // Método para forzar reset si es necesario
  resetService(serviceKey: string) {
    this.lastFetchTimes.delete(serviceKey);
    this.requestCounts.delete(serviceKey);
    console.log(`🔄 Reset throttling para ${serviceKey}`);
  }

  // Limpiar todo el throttling
  reset() {
    this.lastFetchTimes.clear();
    this.requestCounts.clear();
    this.windowStart = Date.now();
    console.log('🔄 Reset completo de throttling');
  }
}

export const dataThrottlingService = new DataThrottlingService();
