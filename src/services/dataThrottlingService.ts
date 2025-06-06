
export class DataThrottlingService {
  private lastFetchTimes = new Map<string, number>();
  private readonly THROTTLE_INTERVALS = {
    coinGecko: 30000, // Reducido a 30s para datos más frescos
    defiLlama: 20000, // Reducido a 20s
    blockfrost: 15000, // Reducido a 15s 
    arbitrage: 10000, // Reducido a 10s para capturar más oportunidades
    marketData: 15000, // Reducido a 15s para datos más frescos
    websocket: 5000, // Nuevo: para reconexiones WebSocket
    realtime: 1000 // Nuevo: para actualizaciones en tiempo real
  };

  canFetch(source: keyof typeof this.THROTTLE_INTERVALS): boolean {
    const now = Date.now();
    const lastFetch = this.lastFetchTimes.get(source) || 0;
    const interval = this.THROTTLE_INTERVALS[source];
    
    if (now - lastFetch >= interval) {
      this.lastFetchTimes.set(source, now);
      return true;
    }
    
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

  // Método mejorado para verificar el estado del throttling
  getThrottlingStatus(): Record<string, { canFetch: boolean; nextAllowedIn: number; interval: number }> {
    const now = Date.now();
    const status: Record<string, { canFetch: boolean; nextAllowedIn: number; interval: number }> = {};
    
    Object.keys(this.THROTTLE_INTERVALS).forEach((source) => {
      const key = source as keyof typeof this.THROTTLE_INTERVALS;
      const lastFetch = this.lastFetchTimes.get(key) || 0;
      const interval = this.THROTTLE_INTERVALS[key];
      const nextAllowed = lastFetch + interval;
      
      status[source] = {
        canFetch: now >= nextAllowed,
        nextAllowedIn: Math.max(0, nextAllowed - now),
        interval
      };
    });
    
    return status;
  }

  // Nuevo método para forzar un reset inteligente
  forceReset(source: keyof typeof this.THROTTLE_INTERVALS, delay: number = 0): void {
    setTimeout(() => {
      this.lastFetchTimes.set(source, 0);
      console.log(`🔄 Force reset throttling for ${source}`);
    }, delay);
  }

  // Método para ajustar dinámicamente los intervalos basado en la calidad de conexión
  adjustInterval(source: keyof typeof this.THROTTLE_INTERVALS, multiplier: number): void {
    if (multiplier < 0.5 || multiplier > 3) {
      console.warn(`⚠️ Invalid multiplier ${multiplier} for ${source}, should be between 0.5 and 3`);
      return;
    }

    // Temporarily adjust the interval (this would need more sophisticated state management for persistence)
    const currentInterval = this.THROTTLE_INTERVALS[source];
    const newInterval = Math.round(currentInterval * multiplier);
    
    console.log(`⚙️ Adjusting ${source} interval from ${currentInterval}ms to ${newInterval}ms`);
    
    // For now, just log the change. In a production environment, 
    // you'd want to update the intervals map or store the adjustments
  }
}

export const dataThrottlingService = new DataThrottlingService();
