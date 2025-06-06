
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, clearOldCachedData, cacheADAPrice, cacheProtocolData, cacheDEXVolume, cacheNetworkData } from './services/databaseService.ts';
import { fetchEnhancedADAData, fetchCardanoProtocols, fetchDEXVolumes } from './services/defiLlamaService.ts';
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

    // Handle manual cache data insertion
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
          }, {
            onConflict: 'pair,source_dex',
            ignoreDuplicates: false
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

    console.log('🚀 Starting real data fetch process...');
    
    let totalPoolsProcessed = 0;
    let totalArbitrageOpportunities = 0;
    let sourcesProcessed = [];

    // Clear old cached data (older than 1 hour)
    await clearOldCachedData(supabaseClient);

    // 1. Get REAL ADA data from multiple sources
    console.log('📊 Fetching REAL ADA data from external APIs...');
    try {
      const realAdaData = await fetchEnhancedADAData();
      if (realAdaData && realAdaData.price > 0) {
        // Cache real ADA data with comprehensive information
        const { error } = await supabaseClient
          .from('market_data_cache')
          .upsert({
            pair: 'ADA/USD',
            price: realAdaData.price,
            source_dex: 'CoinGecko',
            timestamp: new Date().toISOString(),
            volume_24h: realAdaData.volume24h,
            market_cap: realAdaData.marketCap,
            change_24h: realAdaData.change24h
          }, {
            onConflict: 'pair,source_dex',
            ignoreDuplicates: false
          });

        if (!error) {
          console.log(`✅ REAL ADA data cached: $${realAdaData.price}, Vol: $${realAdaData.volume24h}, Change: ${realAdaData.change24h}%`);
          sourcesProcessed.push('CoinGecko');
          totalPoolsProcessed++;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching real ADA data:', error);
    }

    // 2. Get real Cardano DeFi protocols data
    console.log('📊 Fetching real Cardano protocols from DeFiLlama...');
    try {
      const cardanoProtocols = await fetchCardanoProtocols();
      for (const protocol of cardanoProtocols) {
        try {
          await cacheProtocolData(supabaseClient, protocol);
          totalPoolsProcessed++;
        } catch (error) {
          console.error('Error processing real protocol:', protocol.name, error);
        }
      }
      if (cardanoProtocols.length > 0) {
        sourcesProcessed.push('DeFiLlama-Protocols');
      }
    } catch (error) {
      console.error('❌ Error fetching real protocols:', error);
    }

    // 3. Get real DEX volumes
    console.log('📊 Fetching real DEX volumes from DeFiLlama...');
    try {
      const dexProtocols = await fetchDEXVolumes();
      for (const dex of dexProtocols) {
        try {
          await cacheDEXVolume(supabaseClient, dex);
          totalPoolsProcessed++;
        } catch (error) {
          console.error('Error processing real DEX:', dex.name, error);
        }
      }
      if (dexProtocols.length > 0) {
        sourcesProcessed.push('DeFiLlama-DEX');
      }
    } catch (error) {
      console.error('❌ Error fetching real DEX volumes:', error);
    }

    // 4. Use Blockfrost for real Cardano network data
    console.log('🔗 Fetching real Cardano network data from Blockfrost...');
    const blockfrostKey = Deno.env.get('BLOCKFROST_API_KEY');
    if (blockfrostKey) {
      try {
        const networkData = await fetchNetworkData(blockfrostKey);
        if (networkData) {
          await cacheNetworkData(supabaseClient, networkData);
          totalPoolsProcessed++;
          sourcesProcessed.push('Blockfrost');
          console.log('✅ Real Blockfrost network data processed successfully');
        }
      } catch (error) {
        console.error('❌ Error fetching real Blockfrost data:', error);
      }
    } else {
      console.warn('⚠️ BLOCKFROST_API_KEY not configured');
    }

    // 5. Cache Blockfrost connection indicator
    if (blockfrostKey) {
      try {
        const { error } = await supabaseClient
          .from('market_data_cache')
          .upsert({
            pair: 'CARDANO/STATUS',
            price: 1,
            source_dex: 'Blockfrost',
            timestamp: new Date().toISOString(),
            volume_24h: 0,
            market_cap: 0,
            change_24h: 0
          }, {
            onConflict: 'pair,source_dex',
            ignoreDuplicates: false
          });

        if (!error) {
          console.log('✅ Blockfrost status indicator updated');
        }
      } catch (error) {
        console.error('❌ Error updating Blockfrost status:', error);
      }
    }

    // 6. Detect arbitrage opportunities
    try {
      totalArbitrageOpportunities = await detectArbitrageOpportunities(supabaseClient);
    } catch (error) {
      console.error('❌ Error detecting arbitrage opportunities:', error);
    }

    const responseData = {
      success: true,
      message: 'Real data fetch completed successfully',
      data: {
        pools_processed: totalPoolsProcessed,
        arbitrage_opportunities: totalArbitrageOpportunities,
        sources_processed: sourcesProcessed,
        sources_count: sourcesProcessed.length,
        blockfrost_enabled: !!blockfrostKey,
        defillama_enabled: true,
        real_data_fetched: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Real data fetch summary:', responseData.data);

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in real data fetch function:', error);
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
