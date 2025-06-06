
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function clearOldCachedData(supabaseClient: any): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { error } = await supabaseClient
      .from('market_data_cache')
      .delete()
      .lt('timestamp', oneHourAgo);
      
    if (error) {
      console.error('Error clearing old data:', error);
    } else {
      console.log('🧹 Old data cleaned successfully');
    }
  } catch (error) {
    console.error('Error in clearOldCachedData:', error);
  }
}

export async function cacheADAPrice(supabaseClient: any, price: number): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    
    // Usar upsert con ON CONFLICT para evitar duplicados
    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: 'ADA/USD',
        price: price,
        source_dex: 'DeFiLlama',
        timestamp: timestamp,
        volume_24h: 0,
        market_cap: 0,
        change_24h: 0
      }, {
        onConflict: 'pair,source_dex',
        ignoreDuplicates: false
      });
      
    if (error) {
      console.error('Error upserting ADA price:', error);
    } else {
      console.log(`✅ ADA price cached: $${price}`);
    }
  } catch (error) {
    console.warn('⚠️ Error caching ADA price:', error);
  }
}

export async function cacheProtocolData(supabaseClient: any, protocol: any): Promise<void> {
  try {
    if (!protocol.name || !protocol.tvl) return;

    const timestamp = new Date().toISOString();
    const pairName = `${protocol.name}/TVL`;
    
    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: pairName,
        price: protocol.tvl,
        source_dex: 'DeFiLlama',
        timestamp: timestamp,
        volume_24h: protocol.change_1d || 0,
        market_cap: protocol.tvl || 0,
        change_24h: protocol.change_1d || 0
      }, {
        onConflict: 'pair,source_dex',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error upserting protocol ${protocol.name}:`, error);
    }
  } catch (error) {
    console.warn(`⚠️ Error caching protocol ${protocol.name}:`, error);
  }
}

export async function cacheDEXVolume(supabaseClient: any, dex: any): Promise<void> {
  try {
    if (!dex.name || !dex.total24h) return;

    const timestamp = new Date().toISOString();
    const pairName = `${dex.name}/Volume`;
    
    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: pairName,
        price: dex.total24h,
        source_dex: 'DeFiLlama',
        timestamp: timestamp,
        volume_24h: dex.total24h || 0,
        market_cap: 0,
        change_24h: dex.change_1d || 0
      }, {
        onConflict: 'pair,source_dex',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error upserting DEX ${dex.name}:`, error);
    }
  } catch (error) {
    console.warn(`⚠️ Error caching DEX volume ${dex.name}:`, error);
  }
}

export async function cacheNetworkData(supabaseClient: any, networkData: any): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    
    // Manejar valores grandes de supply para evitar overflow
    const circulating = networkData.supply?.circulating || 0;
    const total = networkData.supply?.total || 0;
    
    // Convertir a billones para evitar overflow numérico
    const circulatingInBillions = Math.min(circulating / 1000000000, 999999);
    const totalInBillions = Math.min(total / 1000000000, 999999);
    
    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: 'CARDANO/NETWORK',
        price: circulatingInBillions,
        source_dex: 'Blockfrost',
        timestamp: timestamp,
        volume_24h: 0,
        market_cap: totalInBillions,
        change_24h: 0
      }, {
        onConflict: 'pair,source_dex',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error upserting network data:', error);
    } else {
      console.log('✅ Blockfrost network data cached successfully');
    }
  } catch (error) {
    console.warn('⚠️ Error caching network data:', error);
  }
}
