
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, clearOldCachedData, cacheADAPrice, cacheProtocolData, cacheDEXVolume, cacheNetworkData } from './services/databaseService.ts';
import { fetchADAPrice, fetchCardanoProtocols, fetchDEXVolumes } from './services/defiLlamaService.ts';
import { fetchNetworkData, handleBlockfrostRequest } from './services/blockfrostService.ts';
import { detectArbitrageOpportunities } from './services/arbitrageService.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createSupabaseClient();
    const requestBody = await req.json();
    const { action, endpoint, data } = requestBody;

    // Handle Blockfrost requests
    if (action === 'blockfrost_request') {
      const blockfrostKey = Deno.env.get('BLOCKFROST_API_KEY');
      if (!blockfrostKey) {
        throw new Error('BLOCKFROST_API_KEY not configured');
      }

      const data = await handleBlockfrostRequest(endpoint, blockfrostKey);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // NUEVO: Handle manual cache data insertion
    if (action === 'cache_data' && data) {
      console.log(`📥 Caching manual data for ${data.pair} from ${data.source_dex}`);
      
      try {
        const { error } = await supabaseClient
          .from('market_data_cache')
          .upsert({
            pair: data.pair,
            price: data.price,
            volume_24h: data.volume_24h || 0,
            change_24h: data.change_24h || 0,
            source_dex: data.source_dex,
            timestamp: data.timestamp || new Date().toISOString(),
            high_24h: data.high_24h || null,
            low_24h: data.low_24h || null,
            market_cap: data.market_cap || 0
          });

        if (error) {
          console.error('Error caching manual data:', error);
          throw error;
        }

        console.log(`✅ Manual data cached successfully for ${data.pair}`);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Data cached successfully',
          pair: data.pair
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });

      } catch (error) {
        console.error('Error in manual cache operation:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    console.log('🚀 Starting data fetch process...');
    
    let totalPoolsProcessed = 0;
    let totalArbitrageOpportunities = 0;

    // Clear old cached data (older than 1 hour)
    await clearOldCachedData(supabaseClient);

    // 1. Get ADA price from DeFiLlama
    const adaPrice = await fetchADAPrice();
    await cacheADAPrice(supabaseClient, adaPrice);

    // 2. Get Cardano DeFi protocols data from DeFiLlama
    const cardanoProtocols = await fetchCardanoProtocols();
    for (const protocol of cardanoProtocols) {
      try {
        await cacheProtocolData(supabaseClient, protocol);
        totalPoolsProcessed++;
      } catch (error) {
        console.error('Error processing DeFiLlama protocol:', protocol.name, error);
      }
    }

    // 3. Get DEX volumes from DeFiLlama DEX API
    const dexProtocols = await fetchDEXVolumes();
    for (const dex of dexProtocols) {
      try {
        await cacheDEXVolume(supabaseClient, dex);
        totalPoolsProcessed++;
      } catch (error) {
        console.error('Error processing DeFiLlama DEX:', dex.name, error);
      }
    }

    // 4. Use Blockfrost for additional Cardano network data
    const blockfrostKey = Deno.env.get('BLOCKFROST_API_KEY');
    if (blockfrostKey) {
      const networkData = await fetchNetworkData(blockfrostKey);
      if (networkData) {
        await cacheNetworkData(supabaseClient, networkData);
        totalPoolsProcessed++;
      }
    }

    // 5. Detect arbitrage opportunities
    totalArbitrageOpportunities = await detectArbitrageOpportunities(supabaseClient);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data fetch completed successfully',
        data: {
          pools_processed: totalPoolsProcessed,
          arbitrage_opportunities: totalArbitrageOpportunities,
          ada_price: adaPrice,
          sources_used: ['Blockfrost', 'DeFiLlama'],
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in fetch-dex-data function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
