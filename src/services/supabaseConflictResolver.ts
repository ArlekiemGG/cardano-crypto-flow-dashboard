
import { supabase } from '@/integrations/supabase/client';

export class SupabaseConflictResolver {
  private insertQueue = new Map<string, any>();
  private isProcessing = false;

  async safeInsertMarketData(data: {
    pair: string;
    price: number;
    volume_24h?: number;
    change_24h?: number;
    source_dex: string;
    timestamp?: string;
    high_24h?: number;
    low_24h?: number;
    market_cap?: number;
  }): Promise<void> {
    const key = `${data.pair}-${data.source_dex}`;
    this.insertQueue.set(key, data);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.insertQueue.size === 0) return;
    
    this.isProcessing = true;
    
    try {
      // Procesar en lotes para evitar conflictos
      const entries = Array.from(this.insertQueue.entries());
      this.insertQueue.clear();
      
      for (const [key, data] of entries) {
        try {
          // Primero intentar actualizar si existe
          const { data: existing } = await supabase
            .from('market_data_cache')
            .select('id')
            .eq('pair', data.pair)
            .eq('source_dex', data.source_dex)
            .maybeSingle();

          if (existing) {
            // Actualizar registro existente
            await supabase
              .from('market_data_cache')
              .update({
                price: data.price,
                volume_24h: data.volume_24h,
                change_24h: data.change_24h,
                timestamp: data.timestamp || new Date().toISOString(),
                high_24h: data.high_24h,
                low_24h: data.low_24h,
                market_cap: data.market_cap
              })
              .eq('id', existing.id);
          } else {
            // Insertar nuevo registro
            await supabase
              .from('market_data_cache')
              .insert(data);
          }
        } catch (error) {
          console.warn(`⚠️ Error procesando ${key}:`, error);
          // Continuar con el siguiente elemento en lugar de fallar todo
        }
      }
    } catch (error) {
      console.error('❌ Error procesando cola de inserción:', error);
    } finally {
      this.isProcessing = false;
      
      // Si hay más elementos en cola, procesarlos
      if (this.insertQueue.size > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  async safeInsertArbitrageOpportunity(data: {
    dex_pair: string;
    source_dex_a: string;
    source_dex_b: string;
    price_a: number;
    price_b: number;
    price_diff: number;
    profit_potential: number;
    volume_available: number;
    confidence_score: number;
    is_active: boolean;
    timestamp: string;
  }): Promise<void> {
    try {
      // Primero limpiar oportunidades antiguas del mismo par
      await supabase
        .from('arbitrage_opportunities')
        .delete()
        .eq('dex_pair', data.dex_pair)
        .eq('source_dex_a', data.source_dex_a)
        .eq('source_dex_b', data.source_dex_b);

      // Luego insertar la nueva
      await supabase
        .from('arbitrage_opportunities')
        .insert(data);
        
    } catch (error) {
      console.warn('⚠️ Error insertando oportunidad de arbitraje:', error);
    }
  }
}

export const supabaseConflictResolver = new SupabaseConflictResolver();
