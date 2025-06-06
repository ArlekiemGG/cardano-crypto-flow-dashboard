
import { retryWithBackoff, fetchWithTimeout } from '../utils/retry.ts';

export async function fetchADAPrice(): Promise<number> {
  try {
    console.log('🪙 Fetching real ADA price from multiple sources...');
    
    // Try CoinGecko first for most accurate pricing
    try {
      const cgResponse = await retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true', {}, 15000);
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        return await response.json();
      });
      
      if (cgResponse.cardano?.usd) {
        const price = cgResponse.cardano.usd;
        console.log(`✅ Real ADA price from CoinGecko: $${price}`);
        return price;
      }
    } catch (error) {
      console.warn('⚠️ CoinGecko failed, trying DeFiLlama:', error);
    }

    // Fallback to DeFiLlama
    const defiLlamaResponse = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://coins.llama.fi/prices/current/coingecko:cardano', {}, 15000);
      if (!response.ok) throw new Error(`DeFiLlama price API error: ${response.status}`);
      return await response.json();
    });
    
    const price = defiLlamaResponse.coins?.['coingecko:cardano']?.price || 0;
    
    if (price > 0) {
      console.log(`✅ Real ADA price from DeFiLlama: $${price}`);
      return price;
    } else {
      console.warn('⚠️ Invalid price received, using last known good price');
      return 0;
    }
  } catch (error) {
    console.error('❌ All price sources failed:', error);
    return 0;
  }
}

export async function fetchEnhancedADAData(): Promise<{
  price: number;
  volume24h: number;
  change24h: number;
  marketCap: number;
}> {
  try {
    console.log('📊 Fetching comprehensive ADA data...');
    
    // Try CoinGecko detailed endpoint first
    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true', {}, 15000);
        if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
        return await res.json();
      });

      if (response.cardano) {
        const data = response.cardano;
        return {
          price: data.usd || 0,
          volume24h: data.usd_24h_vol || 0,
          change24h: data.usd_24h_change || 0,
          marketCap: data.usd_market_cap || 0
        };
      }
    } catch (error) {
      console.warn('⚠️ CoinGecko detailed data failed:', error);
    }

    // Fallback to basic price
    const price = await fetchADAPrice();
    return {
      price,
      volume24h: 0,
      change24h: 0,
      marketCap: 0
    };
  } catch (error) {
    console.error('❌ Error fetching enhanced ADA data:', error);
    return {
      price: 0,
      volume24h: 0,
      change24h: 0,
      marketCap: 0
    };
  }
}

export async function fetchCardanoProtocols(): Promise<any[]> {
  try {
    console.log('🏦 Fetching Cardano DeFi protocols from DeFiLlama...');
    const protocolsData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://api.llama.fi/protocols', {}, 20000);
      if (!response.ok) throw new Error(`DeFiLlama protocols error: ${response.status}`);
      return await response.json();
    });

    const cardanoProtocols = protocolsData.filter((protocol: any) => 
      protocol.chains?.includes('Cardano') && 
      protocol.tvl > 10000 && 
      protocol.name && 
      typeof protocol.tvl === 'number'
    );

    console.log(`✅ Processed ${cardanoProtocols.length} real Cardano DeFi protocols`);
    return cardanoProtocols.slice(0, 30);
  } catch (error) {
    console.error('❌ DeFiLlama protocols error:', error);
    return [];
  }
}

export async function fetchDEXVolumes(): Promise<any[]> {
  try {
    console.log('📈 Fetching real Cardano DEX volumes from DeFiLlama...');
    const dexData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://api.llama.fi/overview/dexs/cardano', {}, 20000);
      if (!response.ok) throw new Error(`DeFiLlama DEX error: ${response.status}`);
      return await response.json();
    });

    if (dexData.protocols && Array.isArray(dexData.protocols)) {
      const validDexes = dexData.protocols.filter((dex: any) => 
        dex.name && 
        typeof dex.total24h === 'number' && 
        dex.total24h > 0
      );
      
      console.log(`✅ Processed ${validDexes.length} real Cardano DEXs with valid volume data`);
      return validDexes.slice(0, 25);
    }
    
    return [];
  } catch (error) {
    console.error('❌ DeFiLlama DEX volumes error:', error);
    return [];
  }
}
