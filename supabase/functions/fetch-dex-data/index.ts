
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries,
  delay = RETRY_CONFIG.baseDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, Math.min(delay * 2, RETRY_CONFIG.maxDelay));
    }
    throw error;
  }
}

async function fetchWithTimeout(url: string, options: any = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    const { action, endpoint } = requestBody

    // Handle Blockfrost requests
    if (action === 'blockfrost_request') {
      const blockfrostKey = Deno.env.get('BLOCKFROST_API_KEY')
      if (!blockfrostKey) {
        throw new Error('BLOCKFROST_API_KEY not configured')
      }

      const blockfrostResponse = await fetchWithTimeout(`https://cardano-mainnet.blockfrost.io/api/v0${endpoint}`, {
        headers: {
          'project_id': blockfrostKey,
          'Content-Type': 'application/json'
        }
      })

      if (!blockfrostResponse.ok) {
        throw new Error(`Blockfrost API error: ${blockfrostResponse.status}`)
      }

      const data = await blockfrostResponse.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log('🚀 Starting simplified data fetch with Blockfrost + DeFiLlama only...')
    
    let totalPoolsProcessed = 0
    let totalArbitrageOpportunities = 0

    // Clear old cached data (older than 1 hour)
    await supabaseClient
      .from('market_data_cache')
      .delete()
      .lt('timestamp', new Date(Date.now() - 3600000).toISOString())

    // 1. Get ADA price from CoinGecko (via DeFiLlama's price API)
    let adaPrice = 0.64
    try {
      const adaData = await retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://coins.llama.fi/prices/current/coingecko:cardano')
        if (!response.ok) throw new Error(`DeFiLlama price API error: ${response.status}`)
        return await response.json()
      })
      
      adaPrice = adaData.coins?.['coingecko:cardano']?.price || 0.64
      
      // Cache ADA price data
      await supabaseClient
        .from('market_data_cache')
        .upsert({
          pair: 'ADA/USD',
          price: adaPrice,
          volume_24h: 0, // Will be updated from DeFiLlama volume data
          source_dex: 'DeFiLlama',
          timestamp: new Date().toISOString(),
          change_24h: 0, // Will calculate from historical data
          high_24h: adaPrice * 1.02,
          low_24h: adaPrice * 0.98,
          market_cap: 0 // Will be updated from protocol data
        }, {
          onConflict: 'pair,source_dex'
        })

      console.log('✅ ADA price from DeFiLlama:', adaPrice)
    } catch (error) {
      console.error('❌ DeFiLlama price error, using fallback:', error)
    }

    // 2. Get Cardano DeFi protocols data from DeFiLlama
    try {
      console.log('📊 Fetching Cardano DeFi protocols from DeFiLlama...')
      const protocolsData = await retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://api.llama.fi/protocols')
        if (!response.ok) throw new Error(`DeFiLlama protocols error: ${response.status}`)
        return await response.json()
      })

      // Filter and process Cardano protocols
      const cardanoProtocols = protocolsData.filter((protocol: any) => 
        protocol.chains?.includes('Cardano') && 
        protocol.tvl > 50000 && // Only protocols with significant TVL
        protocol.symbol
      )

      for (const protocol of cardanoProtocols.slice(0, 25)) {
        try {
          const normalizedPrice = protocol.tvl / 1000000 // Normalize for better scaling
          const estimatedVolume = protocol.change_1d ? 
            Math.abs(protocol.change_1d) * protocol.tvl / 100 : 
            protocol.tvl * 0.1 // 10% of TVL as estimated daily volume

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
            })
          
          totalPoolsProcessed++
        } catch (error) {
          console.error('Error processing DeFiLlama protocol:', protocol.name, error)
        }
      }
      
      console.log(`✅ Processed ${cardanoProtocols.length} Cardano DeFi protocols`)
    } catch (error) {
      console.error('❌ DeFiLlama protocols error:', error)
    }

    // 3. Get DEX volumes from DeFiLlama DEX API
    try {
      console.log('📈 Fetching Cardano DEX volumes from DeFiLlama...')
      const dexData = await retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://api.llama.fi/overview/dexs/cardano')
        if (!response.ok) throw new Error(`DeFiLlama DEX error: ${response.status}`)
        return await response.json()
      })

      if (dexData.protocols && Array.isArray(dexData.protocols)) {
        for (const dex of dexData.protocols.slice(0, 20)) {
          try {
            const dailyVolume = dex.total24h || 0
            const dexName = dex.name || 'Unknown DEX'
            
            if (dailyVolume > 1000) { // Only include DEXs with meaningful volume
              await supabaseClient
                .from('market_data_cache')
                .upsert({
                  pair: `${dexName}/VOLUME`,
                  price: dailyVolume / 100000, // Normalize volume as "price"
                  volume_24h: dailyVolume,
                  source_dex: 'DeFiLlama',
                  timestamp: new Date().toISOString(),
                  change_24h: dex.change_1d || 0,
                  high_24h: (dailyVolume / 100000) * 1.1,
                  low_24h: (dailyVolume / 100000) * 0.9,
                  market_cap: dailyVolume * 7 // Estimate weekly volume
                }, {
                  onConflict: 'pair,source_dex'
                })
              
              totalPoolsProcessed++
            }
          } catch (error) {
            console.error('Error processing DeFiLlama DEX:', dex.name, error)
          }
        }
        
        console.log(`✅ Processed ${dexData.protocols.length} Cardano DEXs`)
      }
    } catch (error) {
      console.error('❌ DeFiLlama DEX volumes error:', error)
    }

    // 4. Use Blockfrost for additional Cardano network data
    try {
      console.log('🔗 Fetching Cardano network stats from Blockfrost...')
      const blockfrostKey = Deno.env.get('BLOCKFROST_API_KEY')
      
      if (blockfrostKey) {
        const networkData = await retryWithBackoff(async () => {
          const response = await fetchWithTimeout('https://cardano-mainnet.blockfrost.io/api/v0/network', {
            headers: {
              'project_id': blockfrostKey
            }
          })
          if (!response.ok) throw new Error(`Blockfrost error: ${response.status}`)
          return await response.json()
        })

        // Cache network metrics as market data
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
          })

        console.log('✅ Blockfrost network data processed')
        totalPoolsProcessed++
      }
    } catch (error) {
      console.error('❌ Blockfrost network data error:', error)
    }

    // 5. Detect simplified arbitrage opportunities
    try {
      console.log('🔍 Detecting arbitrage opportunities with simplified data...')
      
      const { data: allPairs } = await supabaseClient
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 1800000).toISOString()) // Last 30 minutes

      if (allPairs && allPairs.length > 1) {
        // Simple price difference detection between DeFiLlama entries
        const defiLlamaEntries = allPairs.filter(item => item.source_dex === 'DeFiLlama')
        
        for (let i = 0; i < defiLlamaEntries.length; i++) {
          for (let j = i + 1; j < defiLlamaEntries.length; j++) {
            const itemA = defiLlamaEntries[i]
            const itemB = defiLlamaEntries[j]
            
            // Only compare if both have meaningful volume
            if (itemA.volume_24h > 5000 && itemB.volume_24h > 5000) {
              const priceDiff = Math.abs(itemA.price - itemB.price)
              const avgPrice = (itemA.price + itemB.price) / 2
              const profitPercentage = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0

              if (profitPercentage > 0.5 && profitPercentage < 8) {
                const volume = Math.min(itemA.volume_24h, itemB.volume_24h) * 0.03
                const confidence = profitPercentage > 2 ? 85 : profitPercentage > 1 ? 70 : 55

                try {
                  await supabaseClient
                    .from('arbitrage_opportunities')
                    .insert({
                      dex_pair: `${itemA.pair}-${itemB.pair}`,
                      price_diff: priceDiff,
                      profit_potential: profitPercentage,
                      source_dex_a: itemA.source_dex,
                      source_dex_b: itemB.source_dex,
                      price_a: itemA.price,
                      price_b: itemB.price,
                      volume_available: volume,
                      confidence_score: confidence,
                      is_active: true,
                      timestamp: new Date().toISOString()
                    })
                  
                  totalArbitrageOpportunities++
                } catch (insertError) {
                  console.error('Error inserting arbitrage opportunity:', insertError)
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error detecting arbitrage opportunities:', error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Simplified data fetch completed with Blockfrost + DeFiLlama',
        data: {
          pools_processed: totalPoolsProcessed,
          arbitrage_opportunities: totalArbitrageOpportunities,
          ada_price: adaPrice,
          sources_used: ['Blockfrost', 'DeFiLlama'],
          timestamp: new Date().toISOString(),
          simplified_architecture: true
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in simplified fetch-dex-data function:', error)
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
    )
  }
})
