
import { retryWithBackoff, fetchWithTimeout } from '../utils/retry.ts';

export async function fetchADAPrice(): Promise<number> {
  let adaPrice = 0.64;
  try {
    const adaData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://coins.llama.fi/prices/current/coingecko:cardano');
      if (!response.ok) throw new Error(`DeFiLlama price API error: ${response.status}`);
      return await response.json();
    });
    
    adaPrice = adaData.coins?.['coingecko:cardano']?.price || 0.64;
    console.log('✅ ADA price from DeFiLlama:', adaPrice);
  } catch (error) {
    console.error('❌ DeFiLlama price error, using fallback:', error);
  }
  
  return adaPrice;
}

export async function fetchCardanoProtocols(): Promise<any[]> {
  try {
    console.log('📊 Fetching Cardano DeFi protocols from DeFiLlama...');
    const protocolsData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://api.llama.fi/protocols');
      if (!response.ok) throw new Error(`DeFiLlama protocols error: ${response.status}`);
      return await response.json();
    });

    // Filter and process Cardano protocols
    const cardanoProtocols = protocolsData.filter((protocol: any) => 
      protocol.chains?.includes('Cardano') && 
      protocol.tvl > 50000 && // Only protocols with significant TVL
      protocol.symbol
    );

    console.log(`✅ Processed ${cardanoProtocols.length} Cardano DeFi protocols`);
    return cardanoProtocols.slice(0, 25);
  } catch (error) {
    console.error('❌ DeFiLlama protocols error:', error);
    return [];
  }
}

export async function fetchDEXVolumes(): Promise<any[]> {
  try {
    console.log('📈 Fetching Cardano DEX volumes from DeFiLlama...');
    const dexData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://api.llama.fi/overview/dexs/cardano');
      if (!response.ok) throw new Error(`DeFiLlama DEX error: ${response.status}`);
      return await response.json();
    });

    if (dexData.protocols && Array.isArray(dexData.protocols)) {
      console.log(`✅ Processed ${dexData.protocols.length} Cardano DEXs`);
      return dexData.protocols.slice(0, 20);
    }
    
    return [];
  } catch (error) {
    console.error('❌ DeFiLlama DEX volumes error:', error);
    return [];
  }
}
