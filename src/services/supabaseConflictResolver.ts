
import { supabase } from '@/integrations/supabase/client';

export class SupabaseConflictResolver {
  private insertQueue = new Map<string, any>();
  private isProcessing = false;

  // CAMBIO IMPORTANTE: No insertar directamente, usar edge function
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
    // En lugar de insertar directamente, usar el edge function para evitar conflictos
    try {
      console.log(`🔄 Enviando datos a edge function para ${data.pair} desde ${data.source_dex}`);
      
      // Usar el edge function que ya maneja upserts correctamente
      await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ 
          action: 'cache_data',
          data: data
        })
      });
      
      console.log(`✅ Datos enviados a edge function para ${data.pair}`);
    } catch (error) {
      console.warn(`⚠️ Error enviando datos a edge function para ${data.pair}:`, error);
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
      // Usar upsert para arbitraje (menos crítico para conflictos)
      const { error } = await supabase
        .from('arbitrage_opportunities')
        .upsert(data);
        
      if (error) {
        console.warn('⚠️ Error insertando oportunidad de arbitraje:', error);
      }
    } catch (error) {
      console.warn('⚠️ Error insertando oportunidad de arbitraje:', error);
    }
  }
}

export const supabaseConflictResolver = new SupabaseConflictResolver();
