
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function clearOldCachedData(supabaseClient: any): Promise<void> {
  await supabaseClient
    .from('market_data_cache')
    .delete()
    .lt('timestamp', new Date(Date.now() - 3600000).toISOString());
}

export async function cacheADAPrice(supabaseClient: any, adaPrice: number): Promise<void> {
  await supabaseClient
    .from('market_data_cache')
    .upsert({
      pair: 'ADA/USD',
      price: adaPrice,
      volume_24h: 0,
      source_dex: 'DeFiLlama',
      timestamp: new Date().toISOString(),
      change_24h: 0,
      high_24h: adaPrice * 1.02,
      low_24h: adaPrice * 0.98,
      market_cap: 0
    }, {
      onConflict: 'pair,source_dex'
    });
}

export async function cacheProtocolData(supabaseClient: any, protocol: any): Promise<void> {
  const normalizedPrice = protocol.tvl / 1000000;
  const estimatedVolume = protocol.change_1d ? 
    Math.abs(protocol.change_1d) * protocol.tvl / 100 : 
    protocol.tvl * 0.1;

  await supabaseClient
    .from('market_data_cache')
    .upsert({
      pair: `${protocol.symbol}/ADA`,
      price: normalizedPrice,
      volume_24h: estimatedVolume,
      source_dex: 'DeFiLlama',
      timestamp: new Date().toISOString(),
      change_24h: protocol.change_1d || 0,
      high_24h: normalizedPrice * 1.03,
      low_24h: normalizedPrice * 0.97,
      market_cap: protocol.tvl
    }, {
      onConflict: 'pair,source_dex'
    });
}

export async function cacheDEXVolume(supabaseClient: any, dex: any): Promise<void> {
  const dailyVolume = dex.total24h || 0;
  const dexName = dex.name || 'Unknown DEX';
  
  if (dailyVolume > 1000) {
    await supabaseClient
      .from('market_data_cache')
      .upsert({
        pair: `${dexName}/VOLUME`,
        price: dailyVolume / 100000,
        volume_24h: dailyVolume,
        source_dex: 'DeFiLlama',
        timestamp: new Date().toISOString(),
        change_24h: dex.change_1d || 0,
        high_24h: (dailyVolume / 100000) * 1.1,
        low_24h: (dailyVolume / 100000) * 0.9,
        market_cap: dailyVolume * 7
      }, {
        onConflict: 'pair,source_dex'
      });
  }
}

export async function cacheNetworkData(supabaseClient: any, networkData: any): Promise<void> {
  await supabaseClient
    .from('market_data_cache')
    .upsert({
      pair: 'CARDANO/NETWORK',
      price: networkData.stake?.live || 0,
      volume_24h: networkData.supply?.circulating || 0,
      source_dex: 'Blockfrost',
      timestamp: new Date().toISOString(),
      change_24h: 0,
      high_24h: (networkData.stake?.live || 0) * 1.001,
      low_24h: (networkData.stake?.live || 0) * 0.999,
      market_cap: networkData.supply?.total || 0
    }, {
      onConflict: 'pair,source_dex'
    });
}
