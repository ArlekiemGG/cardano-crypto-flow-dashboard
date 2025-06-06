
export async function detectArbitrageOpportunities(supabaseClient: any): Promise<number> {
  let totalArbitrageOpportunities = 0;
  
  try {
    console.log('🔍 Detecting arbitrage opportunities with simplified data...');
    
    const { data: allPairs } = await supabaseClient
      .from('market_data_cache')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 1800000).toISOString()); // Last 30 minutes

    if (allPairs && allPairs.length > 1) {
      // Simple price difference detection between DeFiLlama entries
      const defiLlamaEntries = allPairs.filter((item: any) => item.source_dex === 'DeFiLlama');
      
      for (let i = 0; i < defiLlamaEntries.length; i++) {
        for (let j = i + 1; j < defiLlamaEntries.length; j++) {
          const itemA = defiLlamaEntries[i];
          const itemB = defiLlamaEntries[j];
          
          // Only compare if both have meaningful volume
          if (itemA.volume_24h > 5000 && itemB.volume_24h > 5000) {
            const priceDiff = Math.abs(itemA.price - itemB.price);
            const avgPrice = (itemA.price + itemB.price) / 2;
            const profitPercentage = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

            if (profitPercentage > 0.5 && profitPercentage < 8) {
              const volume = Math.min(itemA.volume_24h, itemB.volume_24h) * 0.03;
              const confidence = profitPercentage > 2 ? 85 : profitPercentage > 1 ? 70 : 55;

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
                  });
                
                totalArbitrageOpportunities++;
              } catch (insertError) {
                console.error('Error inserting arbitrage opportunity:', insertError);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error detecting arbitrage opportunities:', error);
  }
  
  return totalArbitrageOpportunities;
}
