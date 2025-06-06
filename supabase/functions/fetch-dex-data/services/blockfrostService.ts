
import { retryWithBackoff, fetchWithTimeout } from '../utils/retry.ts';

export async function fetchNetworkData(blockfrostKey: string): Promise<any | null> {
  try {
    console.log('🔗 Fetching comprehensive Cardano network data from Blockfrost...');
    
    // Fetch multiple endpoints for comprehensive network data
    const [networkData, epochData, protocolParams] = await Promise.allSettled([
      // Network stats
      retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://cardano-mainnet.blockfrost.io/api/v0/network', {
          headers: { 'project_id': blockfrostKey }
        }, 15000);
        if (!response.ok) throw new Error(`Blockfrost network error: ${response.status}`);
        return await response.json();
      }),
      
      // Current epoch info
      retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest', {
          headers: { 'project_id': blockfrostKey }
        }, 15000);
        if (!response.ok) throw new Error(`Blockfrost epoch error: ${response.status}`);
        return await response.json();
      }),

      // Protocol parameters
      retryWithBackoff(async () => {
        const response = await fetchWithTimeout('https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest/parameters', {
          headers: { 'project_id': blockfrostKey }
        }, 15000);
        if (!response.ok) throw new Error(`Blockfrost params error: ${response.status}`);
        return await response.json();
      })
    ]);

    let consolidatedData: any = {
      supply: { circulating: 0, total: 0 },
      epoch: null,
      fees: null,
      timestamp: new Date().toISOString()
    };

    // Process network data
    if (networkData.status === 'fulfilled') {
      const data = networkData.value;
      consolidatedData.supply = {
        circulating: parseInt(data.supply?.circulating || '0'),
        total: parseInt(data.supply?.total || '0')
      };
      console.log('✅ Network supply data processed');
    }

    // Process epoch data
    if (epochData.status === 'fulfilled') {
      consolidatedData.epoch = epochData.value;
      console.log('✅ Epoch data processed');
    }

    // Process protocol parameters
    if (protocolParams.status === 'fulfilled') {
      consolidatedData.fees = protocolParams.value;
      console.log('✅ Protocol parameters processed');
    }

    console.log('✅ Comprehensive Blockfrost data processed successfully');
    return consolidatedData;

  } catch (error) {
    console.error('❌ Blockfrost comprehensive data error:', error);
    return null;
  }
}

export async function handleBlockfrostRequest(endpoint: string, blockfrostKey: string): Promise<any> {
  try {
    console.log(`🔗 Handling Blockfrost request: ${endpoint}`);
    
    const response = await fetchWithTimeout(`https://cardano-mainnet.blockfrost.io/api/v0${endpoint}`, {
      headers: {
        'project_id': blockfrostKey,
        'Content-Type': 'application/json'
      }
    }, 15000);

    if (!response.ok) {
      throw new Error(`Blockfrost API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Blockfrost request successful: ${endpoint}`);
    return data;

  } catch (error) {
    console.error(`❌ Blockfrost request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Enhanced function to get specific Cardano metrics
export async function fetchCardanoMetrics(blockfrostKey: string): Promise<any> {
  try {
    console.log('📊 Fetching detailed Cardano metrics from Blockfrost...');
    
    const [
      networkInfo,
      blockInfo,
      poolsInfo
    ] = await Promise.allSettled([
      handleBlockfrostRequest('/network', blockfrostKey),
      handleBlockfrostRequest('/blocks/latest', blockfrostKey),
      handleBlockfrostRequest('/pools?count=10', blockfrostKey)
    ]);

    const metrics = {
      network: networkInfo.status === 'fulfilled' ? networkInfo.value : null,
      latestBlock: blockInfo.status === 'fulfilled' ? blockInfo.value : null,
      topPools: poolsInfo.status === 'fulfilled' ? poolsInfo.value : [],
      timestamp: new Date().toISOString()
    };

    console.log('✅ Detailed Cardano metrics compiled');
    return metrics;

  } catch (error) {
    console.error('❌ Error fetching Cardano metrics:', error);
    return null;
  }
}
