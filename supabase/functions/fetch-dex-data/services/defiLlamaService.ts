
import { retryWithBackoff, fetchWithTimeout } from '../utils/retry.ts';

export async function fetchADAPrice(): Promise<number> {
  let adaPrice = 0;
  try {
    console.log('🪙 Fetching ADA price from DeFiLlama...');
    const adaData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://coins.llama.fi/prices/current/coingecko:cardano', {}, 15000);
      if (!response.ok) throw new Error(`DeFiLlama price API error: ${response.status}`);
      return await response.json();
    });
    
    adaPrice = adaData.coins?.['coingecko:cardano']?.price || 0;
    
    if (adaPrice > 0) {
      console.log(`✅ ADA price from DeFiLlama: $${adaPrice}`);
    } else {
      console.warn('⚠️ Invalid ADA price received from DeFiLlama');
      adaPrice = 0.67; // Fallback price
    }
  } catch (error) {
    console.error('❌ DeFiLlama price error, using fallback:', error);
    adaPrice = 0.67; // Fallback price
  }
  
  return adaPrice;
}

export async function fetchCardanoProtocols(): Promise<any[]> {
  try {
    console.log('🏦 Fetching Cardano DeFi protocols from DeFiLlama...');
    const protocolsData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://api.llama.fi/protocols', {}, 20000);
      if (!response.ok) throw new Error(`DeFiLlama protocols error: ${response.status}`);
      return await response.json();
    });

    // Filter and process Cardano protocols with better validation
    const cardanoProtocols = protocolsData.filter((protocol: any) => 
      protocol.chains?.includes('Cardano') && 
      protocol.tvl > 10000 && // Lower threshold for more protocols
      protocol.name && 
      typeof protocol.tvl === 'number'
    );

    console.log(`✅ Processed ${cardanoProtocols.length} Cardano DeFi protocols`);
    return cardanoProtocols.slice(0, 30); // Increased limit
  } catch (error) {
    console.error('❌ DeFiLlama protocols error:', error);
    return [];
  }
}

export async function fetchDEXVolumes(): Promise<any[]> {
  try {
    console.log('📈 Fetching Cardano DEX volumes from DeFiLlama...');
    const dexData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://api.llama.fi/overview/dexs/cardano', {}, 20000);
      if (!response.ok) throw new Error(`DeFiLlama DEX error: ${response.status}`);
      return await response.json();
    });

    if (dexData.protocols && Array.isArray(dexData.protocols)) {
      // Filter valid DEX data
      const validDexes = dexData.protocols.filter((dex: any) => 
        dex.name && 
        typeof dex.total24h === 'number' && 
        dex.total24h > 0
      );
      
      console.log(`✅ Processed ${validDexes.length} Cardano DEXs with valid volume data`);
      return validDexes.slice(0, 25);
    }
    
    return [];
  } catch (error) {
    console.error('❌ DeFiLlama DEX volumes error:', error);
    return [];
  }
}

// Additional function to get enhanced ADA data
export async function fetchEnhancedADAData(): Promise<any> {
  try {
    console.log('📊 Fetching enhanced ADA market data...');
    
    // Try multiple endpoints for comprehensive data
    const [priceData, marketData] = await Promise.allSettled([
      retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://coins.llama.fi/prices/current/coingecko:cardano', {}, 15000);
        if (!response.ok) throw new Error(`Price API error: ${response.status}`);
        return await response.json();
      }),
      retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true', {}, 15000);
        if (!response.ok) throw new Error(`Market data API error: ${response.status}`);
        return await response.json();
      })
    ]);

    let enhancedData = {
      price: 0.67,
      volume24h: 0,
      change24h: 0,
      marketCap: 0
    };

    // Process DeFiLlama price data
    if (priceData.status === 'fulfilled' && priceData.value?.coins?.['coingecko:cardano']) {
      enhancedData.price = priceData.value.coins['coingecko:cardano'].price;
      console.log('✅ Price data from DeFiLlama');
    }

    // Process CoinGecko market data
    if (marketData.status === 'fulfilled' && marketData.value?.cardano) {
      const cgData = marketData.value.cardano;
      if (cgData.usd) enhancedData.price = cgData.usd;
      if (cgData.usd_24h_vol) enhancedData.volume24h = cgData.usd_24h_vol;
      if (cgData.usd_24h_change) enhancedData.change24h = cgData.usd_24h_change;
      if (cgData.usd_market_cap) enhancedData.marketCap = cgData.usd_market_cap;
      console.log('✅ Market data from CoinGecko');
    }

    return enhancedData;
  } catch (error) {
    console.error('❌ Error fetching enhanced ADA data:', error);
    return {
      price: 0.67,
      volume24h: 0,
      change24h: 0,
      marketCap: 0
    };
  }
}
