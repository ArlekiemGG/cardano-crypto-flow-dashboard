
import { dataFetchingService } from './dataFetchingService';
import { intervalManagerService } from './intervalManagerService';
import { dataThrottlingService } from './dataThrottlingService';

interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

class RealTimeMarketDataService {
  private subscribers = new Set<(data: RealTimePrice[]) => void>();
  private currentPrices: RealTimePrice[] = [];
  private isServiceActive = false;
  private lastUpdateTime = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  async startRealTimeUpdates(intervalSeconds: number = 45): Promise<void> {
    if (this.isServiceActive) {
      console.log('📊 Servicio ya activo, optimizando configuración...');
      return;
    }

    this.isServiceActive = true;
    console.log(`🚀 Iniciando servicio optimizado (intervalo: ${intervalSeconds}s)...`);
    
    try {
      // Fetch inicial inmediato
      await this.fetchAndNotify();

      // Configurar actualizaciones periódicas más agresivas
      intervalManagerService.startUpdateInterval(async () => {
        if (dataThrottlingService.canFetch('marketData')) {
          await this.fetchAndNotify();
        } else {
          console.log('📊 Throttling activo, esperando siguiente oportunidad...');
        }
      }, intervalSeconds * 1000);

      // Iniciar monitoreo de salud del servicio
      this.startHealthCheck();

    } catch (error) {
      console.error('❌ Error iniciando servicio optimizado:', error);
      this.isServiceActive = false;
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - this.lastUpdateTime;
      
      // Si no hemos tenido actualizaciones en 3 minutos, forzar fetch
      if (timeSinceLastUpdate > 180000) {
        console.log('🔄 Forzando actualización por inactividad prolongada...');
        this.fetchAndNotify().catch(error => {
          console.error('❌ Error en fetch forzado:', error);
        });
      }
    }, 60000); // Check cada minuto
  }

  private async fetchAndNotify(): Promise<void> {
    if (!this.isServiceActive) return;

    try {
      const startTime = Date.now();
      const prices = await dataFetchingService.fetchSimplifiedData();
      const fetchDuration = Date.now() - startTime;
      
      if (prices.length > 0) {
        // Filtrar datos duplicados y obsoletos
        const uniquePrices = this.deduplicatePrices(prices);
        const freshPrices = this.filterFreshData(uniquePrices);
        
        if (freshPrices.length > 0) {
          this.currentPrices = freshPrices;
          this.lastUpdateTime = Date.now();
          this.notifySubscribers(freshPrices);
          intervalManagerService.resetRetryCount();
          
          console.log(`✅ Datos actualizados: ${freshPrices.length} precios únicos (fetch: ${fetchDuration}ms)`);
        } else {
          console.log('⚠️ No hay datos frescos disponibles');
        }
      } else {
        console.log('⚠️ No se obtuvieron datos en esta iteración');
      }

    } catch (error) {
      console.error('❌ Error en fetch optimizado:', error);
      
      const maxRetries = intervalManagerService.incrementRetryCount();
      if (maxRetries) {
        console.error('❌ Máximo de reintentos alcanzado, programando reconexión...');
        intervalManagerService.scheduleReconnect(async () => {
          await this.fetchAndNotify();
        });
      }
    }
  }

  private deduplicatePrices(prices: RealTimePrice[]): RealTimePrice[] {
    const seen = new Set<string>();
    return prices.filter(price => {
      const key = `${price.dex}-${price.pair}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private filterFreshData(prices: RealTimePrice[]): RealTimePrice[] {
    const now = new Date();
    const maxAge = 30 * 60 * 1000; // 30 minutos máximo

    return prices.filter(price => {
      const priceTime = new Date(price.lastUpdate);
      const age = now.getTime() - priceTime.getTime();
      return age <= maxAge;
    });
  }

  subscribe(callback: (data: RealTimePrice[]) => void) {
    this.subscribers.add(callback);
    
    // Enviar datos actuales inmediatamente si están disponibles
    if (this.currentPrices.length > 0) {
      callback(this.currentPrices);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(data: RealTimePrice[]) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error notificando suscriptor:', error);
      }
    });
  }

  getCurrentPrices(): RealTimePrice[] {
    return this.currentPrices;
  }

  isConnected(): boolean {
    const hasData = this.currentPrices.length > 0;
    const isRecent = this.lastUpdateTime > 0 && (Date.now() - this.lastUpdateTime) < 300000; // 5 min
    return this.isServiceActive && hasData && isRecent;
  }

  getConnectionStatus(): {
    isActive: boolean;
    hasData: boolean;
    lastUpdate: number;
    dataAge: number;
    priceCount: number;
  } {
    return {
      isActive: this.isServiceActive,
      hasData: this.currentPrices.length > 0,
      lastUpdate: this.lastUpdateTime,
      dataAge: this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : -1,
      priceCount: this.currentPrices.length
    };
  }

  stop(): void {
    console.log('🛑 Deteniendo servicio optimizado...');
    this.isServiceActive = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    intervalManagerService.cleanup();
    this.subscribers.clear();
    this.currentPrices = [];
    this.lastUpdateTime = 0;
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
