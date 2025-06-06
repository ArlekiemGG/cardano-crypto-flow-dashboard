
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

  async startRealTimeUpdates(intervalSeconds: number = 90): Promise<void> {
    if (this.isServiceActive) {
      console.log('📊 Servicio ya activo, saltando inicialización...');
      return;
    }

    this.isServiceActive = true;
    console.log(`🚀 Iniciando servicio optimizado (intervalo: ${intervalSeconds}s)...`);
    
    try {
      // Fetch inicial
      await this.fetchAndNotify();

      // Configurar actualizaciones periódicas con throttling
      intervalManagerService.startUpdateInterval(async () => {
        if (dataThrottlingService.canFetch('marketData')) {
          await this.fetchAndNotify();
        }
      }, intervalSeconds * 1000);

    } catch (error) {
      console.error('❌ Error iniciando servicio optimizado:', error);
      this.isServiceActive = false;
    }
  }

  private async fetchAndNotify(): Promise<void> {
    if (!this.isServiceActive) return;

    try {
      const prices = await dataFetchingService.fetchSimplifiedData();
      
      if (prices.length > 0) {
        this.currentPrices = prices;
        this.notifySubscribers(prices);
        intervalManagerService.resetRetryCount();
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
    return this.isServiceActive && this.currentPrices.length > 0;
  }

  stop(): void {
    console.log('🛑 Deteniendo servicio optimizado...');
    this.isServiceActive = false;
    intervalManagerService.cleanup();
    this.subscribers.clear();
    this.currentPrices = [];
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
