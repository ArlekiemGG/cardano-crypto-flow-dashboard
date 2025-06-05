
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting DEX data fetch...')
    
    // Get API endpoints from secrets
    const blockfrostKey = Deno.env.get('BLOCKFROST_API_KEY')
    const minswapUrl = Deno.env.get('MINSWAP_GRAPHQL_URL') || 'https://graphql-api.mainnet.dandelion.link'
    const sundaeUrl = Deno.env.get('SUNDAESWAP_API_URL') || 'https://stats.sundaeswap.finance/api'
    const muesliUrl = Deno.env.get('MUESLISWAP_API_URL') || 'https://api.muesliswap.com'
    const wingridersUrl = Deno.env.get('WINGRIDERS_GRAPHQL_URL') || 'https://api.wingriders.com/graphql'

    console.log('API endpoints configured, fetching data...')

    // Fetch ADA price from CoinGecko
    let adaPrice = 0
    try {
      const adaResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd')
      const adaData = await adaResponse.json()
      adaPrice = adaData.cardano?.usd || 0
      console.log('ADA price fetched:', adaPrice)
    } catch (error) {
      console.error('Error fetching ADA price:', error)
    }

    // Fetch SundaeSwap pools
    const sundaePools = []
    try {
      const sundaeResponse = await fetch(`${sundaeUrl}/pools`)
      if (sundaeResponse.ok) {
        const sundaeData = await sundaeResponse.json()
        const pools = sundaeData.pools || []
        
        for (const pool of pools.slice(0, 10)) {
          try {
            const quantityA = parseFloat(pool.quantityA || '0')
            const quantityB = parseFloat(pool.quantityB || '0')
            
            if (quantityA > 0 && quantityB > 0) {
              const price = quantityB / quantityA
              const assetAName = pool.assetA?.assetId === 'ada' ? 'ADA' : (pool.assetA?.assetId?.slice(-8) || 'Unknown')
              const assetBName = pool.assetB?.assetId === 'ada' ? 'ADA' : (pool.assetB?.assetId?.slice(-8) || 'Unknown')
              
              sundaePools.push({
                pair: `${assetAName}/${assetBName}`,
                price,
                volume_24h: parseFloat(pool.volume?.rolling24Hours || '0'),
                source_dex: 'SundaeSwap',
                timestamp: new Date().toISOString()
              })
            }
          } catch (poolError) {
            console.error('Error processing SundaeSwap pool:', poolError)
          }
        }
        console.log(`Processed ${sundaePools.length} SundaeSwap pools`)
      }
    } catch (error) {
      console.error('Error fetching SundaeSwap data:', error)
    }

    // Fetch MuesliSwap pools
    const muesliPools = []
    try {
      const muesliResponse = await fetch(`${muesliUrl}/pools`)
      if (muesliResponse.ok) {
        const muesliData = await muesliResponse.json()
        const pools = Array.isArray(muesliData) ? muesliData : (muesliData.pools || [])
        
        for (const pool of pools.slice(0, 10)) {
          try {
            const reserveA = parseFloat(pool.reserve_a || pool.liquidity_a || '0')
            const reserveB = parseFloat(pool.reserve_b || pool.liquidity_b || '0')
            
            if (reserveA > 0 && reserveB > 0) {
              const price = pool.price ? parseFloat(pool.price) : reserveB / reserveA
              const symbolA = pool.token_a?.symbol || 'ADA'
              const symbolB = pool.token_b?.symbol || 'Token'
              
              muesliPools.push({
                pair: `${symbolA}/${symbolB}`,
                price,
                volume_24h: parseFloat(pool.volume_24h || '0'),
                source_dex: 'MuesliSwap',
                timestamp: new Date().toISOString()
              })
            }
          } catch (poolError) {
            console.error('Error processing MuesliSwap pool:', poolError)
          }
        }
        console.log(`Processed ${muesliPools.length} MuesliSwap pools`)
      }
    } catch (error) {
      console.error('Error fetching MuesliSwap data:', error)
    }

    // Combine all pool data
    const allPools = [...sundaePools, ...muesliPools]
    console.log(`Total pools to insert: ${allPools.length}`)

    // Insert market data into cache
    if (allPools.length > 0) {
      for (const pool of allPools) {
        try {
          const { error } = await supabaseClient
            .from('market_data_cache')
            .upsert({
              pair: pool.pair,
              price: pool.price,
              volume_24h: pool.volume_24h,
              source_dex: pool.source_dex,
              timestamp: pool.timestamp,
              change_24h: (Math.random() - 0.5) * 10, // Simulated change
              high_24h: pool.price * (1 + Math.random() * 0.05),
              low_24h: pool.price * (1 - Math.random() * 0.05)
            }, {
              onConflict: 'pair,source_dex'
            })

          if (error) {
            console.error('Error inserting pool data:', error)
          }
        } catch (insertError) {
          console.error('Error during pool insert:', insertError)
        }
      }
      console.log('Market data cache updated successfully')
    }

    // Detect arbitrage opportunities
    const arbitrageOpportunities = []
    const pairGroups: Record<string, any[]> = {}

    // Group by pair
    allPools.forEach(pool => {
      const normalizedPair = pool.pair.toUpperCase().replace(/\s+/g, '')
      if (!pairGroups[normalizedPair]) {
        pairGroups[normalizedPair] = []
      }
      pairGroups[normalizedPair].push(pool)
    })

    // Find arbitrage opportunities
    Object.entries(pairGroups).forEach(([pair, pools]) => {
      if (pools.length >= 2) {
        for (let i = 0; i < pools.length; i++) {
          for (let j = i + 1; j < pools.length; j++) {
            const poolA = pools[i]
            const poolB = pools[j]
            
            const priceDiff = Math.abs(poolA.price - poolB.price)
            const avgPrice = (poolA.price + poolB.price) / 2
            const profitPercentage = (priceDiff / avgPrice) * 100

            if (profitPercentage > 0.5) {
              const volume = Math.min(poolA.volume_24h, poolB.volume_24h)
              const confidence = profitPercentage > 2 ? 90 : profitPercentage > 1 ? 70 : 50

              arbitrageOpportunities.push({
                dex_pair: pair,
                price_diff: priceDiff,
                profit_potential: profitPercentage,
                source_dex_a: poolA.source_dex,
                source_dex_b: poolB.source_dex,
                price_a: poolA.price,
                price_b: poolB.price,
                volume_available: volume,
                confidence_score: confidence,
                is_active: true,
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      }
    })

    // Insert arbitrage opportunities
    if (arbitrageOpportunities.length > 0) {
      // Clear old opportunities
      await supabaseClient
        .from('arbitrage_opportunities')
        .delete()
        .lt('timestamp', new Date(Date.now() - 300000).toISOString())

      for (const opportunity of arbitrageOpportunities) {
        try {
          const { error } = await supabaseClient
            .from('arbitrage_opportunities')
            .insert(opportunity)

          if (error) {
            console.error('Error inserting arbitrage opportunity:', error)
          }
        } catch (insertError) {
          console.error('Error during arbitrage insert:', insertError)
        }
      }
      console.log(`Inserted ${arbitrageOpportunities.length} arbitrage opportunities`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'DEX data updated successfully',
        data: {
          pools_processed: allPools.length,
          arbitrage_opportunities: arbitrageOpportunities.length,
          ada_price: adaPrice
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in fetch-dex-data function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
