
import { supabase } from '@/integrations/supabase/client';
import { dataThrottlingService } from './dataThrottlingService';
import { supabaseConflictResolver } from './supabaseConflictResolver';

interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

export class DataFetchingService {
  private isFetching = false;
  private lastSuccessfulFetch = 0;

  async fetchSimplifiedData(): Promise<RealTimePrice[]> {
    // Verificar throttling antes de proceder
    if (!dataThrottlingService.canFetch('marketData')) {
      return this.getCachedData();
    }

    if (this.isFetching) {
      console.log('📊 Fetch ya en progreso, saltando...');
      return this.getCachedData();
    }

    this.isFetching = true;
    
    try {
      console.log('📊 Iniciando fetch optimizado de datos...');
      
      // Solo llamar al edge function si han pasado suficientes minutos
      const shouldCallEdgeFunction = dataThrottlingService.canFetch('defiLlama');
      
      if (shouldCallEdgeFunction) {
        const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
          body: JSON.stringify({ action: 'fetch_all' })
        });

        if (error) {
          console.warn('⚠️ Error en edge function, usando datos cacheados:', error);
        } else {
          console.log('✅ Edge function ejecutada exitosamente');
          this.lastSuccessfulFetch = Date.now();
        }
      }

      return await this.getCachedData();

    } catch (error) {
      console.error('❌ Error en fetch optimizado:', error);
      return await this.getCachedData();
    } finally {
      this.isFetching = false;
    }
  }

  private async getCachedData(): Promise<RealTimePrice[]> {
    try {
      const { data: cachedData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 1800000).toISOString()) // Últimos 30 minutos
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo datos cacheados:', error);
        return [];
      }

      if (!cachedData || cachedData.length === 0) {
        return [];
      }

      const prices: RealTimePrice[] = [];
      const seenPairs = new Set<string>();
      
      // Evitar duplicados usando Set
      cachedData.forEach(item => {
        const pairKey = `${item.pair}-${item.source_dex}`;
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          prices.push({
            dex: item.source_dex,
            pair: item.pair,
            price: Number(item.price),
            volume24h: Number(item.volume_24h) || 0,
            liquidity: Number(item.market_cap) || 0,
            lastUpdate: item.timestamp
          });
        }
      });
      
      console.log(`📊 Datos cacheados cargados: ${prices.length} precios únicos`);
      return prices;

    } catch (error) {
      console.error('❌ Error procesando datos cacheados:', error);
      return [];
    }
  }

  canFetch(): boolean {
    return !this.isFetching && dataThrottlingService.canFetch('marketData');
  }

  getLastFetchTime(): number {
    return this.lastSuccessfulFetch;
  }

  isCurrentlyFetching(): boolean {
    return this.isFetching;
  }
}

export const dataFetchingService = new DataFetchingService();
