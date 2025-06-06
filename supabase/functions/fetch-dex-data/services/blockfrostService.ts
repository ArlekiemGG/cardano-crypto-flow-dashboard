
import { retryWithBackoff, fetchWithTimeout } from '../utils/retry.ts';

export async function fetchNetworkData(blockfrostKey: string): Promise<any | null> {
  try {
    console.log('🔗 Fetching Cardano network stats from Blockfrost...');
    
    const networkData = await retryWithBackoff(async () => {
      const response = await fetchWithTimeout('https://cardano-mainnet.blockfrost.io/api/v0/network', {
        headers: {
          'project_id': blockfrostKey
        }
      });
      if (!response.ok) throw new Error(`Blockfrost error: ${response.status}`);
      return await response.json();
    });

    console.log('✅ Blockfrost network data processed');
    return networkData;
  } catch (error) {
    console.error('❌ Blockfrost network data error:', error);
    return null;
  }
}

export async function handleBlockfrostRequest(endpoint: string, blockfrostKey: string): Promise<any> {
  const blockfrostResponse = await fetchWithTimeout(`https://cardano-mainnet.blockfrost.io/api/v0${endpoint}`, {
    headers: {
      'project_id': blockfrostKey,
      'Content-Type': 'application/json'
    }
  });

  if (!blockfrostResponse.ok) {
    throw new Error(`Blockfrost API error: ${blockfrostResponse.status}`);
  }

  return await blockfrostResponse.json();
}
