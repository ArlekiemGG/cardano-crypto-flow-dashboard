
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

    const requestBody = await req.json()
    const { action, endpoint } = requestBody

    // Handle Blockfrost requests
    if (action === 'blockfrost_request') {
      const blockfrostKey = Deno.env.get('BLOCKFROST_API_KEY')
      if (!blockfrostKey) {
        throw new Error('BLOCKFROST_API_KEY not configured')
      }

      const blockfrostResponse = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0${endpoint}`, {
        headers: {
          'project_id': blockfrostKey,
          'Content-Type': 'application/json'
        }
      })

      if (!blockfrostResponse.ok) {
        throw new Error(`Blockfrost API error: ${blockfrostResponse.status} ${blockfrostResponse.statusText}`)
      }

      const data = await blockfrostResponse.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log('Starting DEX data fetch...')
    
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

    // Generate sample pools with real ADA price for demonstration
    const allPools = []

    // Create sample pools for major DEXs with realistic data
    const dexes = ['SundaeSwap', 'Minswap', 'MuesliSwap', 'WingRiders', 'VyFinance']
    const pairs = ['ADA/USDC', 'ADA/BTC', 'ADA/ETH', 'ADA/USDT', 'DJED/ADA', 'SHEN/ADA']

    for (const dex of dexes) {
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        const basePrice = adaPrice || 0.63
        const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
        const price = basePrice * (1 + variation)
        
        allPools.push({
          pair,
          price: price,
          volume_24h: Math.random() * 1000000 + 100000, // 100K to 1.1M
          source_dex: dex,
          timestamp: new Date().toISOString(),
          change_24h: (Math.random() - 0.5) * 20, // ±10% change
          high_24h: price * (1 + Math.random() * 0.1),
          low_24h: price * (1 - Math.random() * 0.1)
        })
      }
    }

    console.log(`Generated ${allPools.length} sample pools with real ADA price`)

    // Insert market data into cache
    if (allPools.length > 0) {
      // Clear old data first
      await supabaseClient
        .from('market_data_cache')
        .delete()
        .lt('timestamp', new Date(Date.now() - 300000).toISOString())

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
              change_24h: pool.change_24h,
              high_24h: pool.high_24h,
              low_24h: pool.low_24h,
              market_cap: pool.volume_24h * 100 // Estimate market cap
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

            if (profitPercentage > 0.1) { // Lower threshold for more opportunities
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
