
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function clearOldCachedData(supabaseClient: any): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    await supabaseClient
      .from('market_data_cache')
      .delete()
      .lt('timestamp', oneHourAgo);
      
    console.log('🧹 Datos antiguos eliminados');
  } catch (error) {
    console.error('Error limpiando datos antiguos:', error);
  }
}

export async function cacheADAPrice(supabaseClient: any, price: number): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: 'ADA/USD',
        price: price,
        source_dex: 'DeFiLlama',
        timestamp: new Date().toISOString(),
        volume_24h: 0,
        market_cap: 0
      });
      
    if (error) {
      console.error('Error en upsert ADA:', error);
    } else {
      console.log(`✅ Precio ADA cacheado: $${price}`);
    }
  } catch (error) {
    console.warn('⚠️ Error cacheando precio ADA:', error);
  }
}

export async function cacheProtocolData(supabaseClient: any, protocol: any): Promise<void> {
  try {
    if (!protocol.name || !protocol.tvl) return;

    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: `${protocol.name}/TVL`,
        price: protocol.tvl,
        source_dex: 'DeFiLlama',
        timestamp: new Date().toISOString(),
        volume_24h: protocol.change_1d || 0,
        market_cap: protocol.tvl || 0
      });

    if (error) {
      console.error(`Error en upsert protocolo ${protocol.name}:`, error);
    }
  } catch (error) {
    console.warn(`⚠️ Error cacheando protocolo ${protocol.name}:`, error);
  }
}

export async function cacheDEXVolume(supabaseClient: any, dex: any): Promise<void> {
  try {
    if (!dex.name || !dex.total24h) return;

    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: `${dex.name}/Volume`,
        price: dex.total24h,
        source_dex: 'DeFiLlama',
        timestamp: new Date().toISOString(),
        volume_24h: dex.total24h || 0,
        market_cap: 0
      });

    if (error) {
      console.error(`Error en upsert DEX ${dex.name}:`, error);
    }
  } catch (error) {
    console.warn(`⚠️ Error cacheando volumen DEX ${dex.name}:`, error);
  }
}

export async function cacheNetworkData(supabaseClient: any, networkData: any): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: 'CARDANO/NETWORK',
        price: networkData.supply?.circulating || 0,
        source_dex: 'Blockfrost',
        timestamp: new Date().toISOString(),
        volume_24h: 0,
        market_cap: networkData.supply?.total || 0
      });

    if (error) {
      console.error('Error en upsert datos de red:', error);
    } else {
      console.log('✅ Datos de red Blockfrost cacheados');
    }
  } catch (error) {
    console.warn('⚠️ Error cacheando datos de red:', error);
  }
}
