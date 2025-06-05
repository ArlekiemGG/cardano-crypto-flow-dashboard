
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { dexService } from '@/services/dexService';
import { blockfrostService } from '@/services/blockfrostService';
import { MarketData, ArbitrageOpportunity } from '@/types/trading';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching real market data from Cardano DEXs...');
      
      // Fetch real ADA price from Blockfrost/CoinGecko
      const realAdaPrice = await blockfrostService.getADAPrice();
      console.log('Real ADA price:', realAdaPrice);
      
      // Update market data using real DEX APIs
      await dexService.updateMarketData();
      
      setIsConnected(true);

      // Fetch cached market data from database
      const { data: cachedData, error: cacheError } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false });

      if (cacheError) {
        console.error('Error fetching cached data:', cacheError);
      } else if (cachedData && cachedData.length > 0) {
        console.log(`Loaded ${cachedData.length} cached price entries`);
        
        // Process and deduplicate market data
        const uniquePairs = new Map<string, any>();
        
        cachedData.forEach(item => {
          const key = item.pair;
          if (!uniquePairs.has(key) || new Date(item.timestamp) > new Date(uniquePairs.get(key).timestamp)) {
            uniquePairs.set(key, item);
          }
        });

        const formattedData: MarketData[] = Array.from(uniquePairs.values()).map(item => ({
          symbol: item.pair.split('/')[0],
          price: realAdaPrice && item.pair.includes('ADA') ? realAdaPrice : Number(item.price),
          change24h: Number(item.change_24h) || 0,
          volume24h: Number(item.volume_24h) || 0,
          marketCap: Number(item.market_cap) || 0,
          lastUpdate: item.timestamp || new Date().toISOString()
        }));

        setMarketData(formattedData);
        console.log(`Processed ${formattedData.length} unique market data entries`);
      }

      // Fetch active arbitrage opportunities
      const { data: arbitrageData, error: arbError } = await supabase
        .from('arbitrage_opportunities')
        .select('*')
        .eq('is_active', true)
        .order('profit_potential', { ascending: false })
        .limit(20);

      if (arbError) {
        console.error('Error fetching arbitrage data:', arbError);
      } else if (arbitrageData && arbitrageData.length > 0) {
        console.log(`Found ${arbitrageData.length} active arbitrage opportunities`);
        
        const formattedOpportunities: ArbitrageOpportunity[] = arbitrageData.map(item => ({
          id: item.id,
          pair: item.dex_pair,
          dexA: item.source_dex_a,
          dexB: item.source_dex_b,
          priceA: Number(item.price_a),
          priceB: Number(item.price_b),
          profitPercentage: Number(item.profit_potential),
          volume: Number(item.volume_available) || 0,
          confidence: item.confidence_score >= 80 ? 'High' : item.confidence_score >= 60 ? 'Medium' : 'Low',
          timestamp: item.timestamp || new Date().toISOString()
        }));

        setArbitrageOpportunities(formattedOpportunities);
      } else {
        setArbitrageOpportunities([]);
      }

      setLastUpdate(new Date());
      console.log('Real market data fetch completed successfully');
    } catch (error) {
      console.error('Error fetching real market data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Initializing real-time DEX data connection...');
    
    // Initial fetch
    fetchMarketData();

    // Create unique channel names with timestamp to avoid conflicts
    const timestamp = Date.now();
    const marketChannelName = `market-data-changes-${timestamp}`;
    const arbitrageChannelName = `arbitrage-changes-${timestamp}`;

    // Set up real-time subscriptions with unique channel names
    const marketDataChannel = supabase
      .channel(marketChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_data_cache'
        },
        () => {
          console.log('Real market data updated, refetching...');
          fetchMarketData();
        }
      )
      .subscribe();

    const arbitrageChannel = supabase
      .channel(arbitrageChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arbitrage_opportunities'
        },
        () => {
          console.log('Real arbitrage opportunities updated, refetching...');
          fetchMarketData();
        }
      )
      .subscribe();

    // Periodic updates every 30 seconds for real-time data
    const interval = setInterval(() => {
      console.log('Periodic real market data update...');
      fetchMarketData();
    }, 30000);

    return () => {
      clearInterval(interval);
      // Properly unsubscribe and remove channels
      marketDataChannel.unsubscribe();
      arbitrageChannel.unsubscribe();
      supabase.removeChannel(marketDataChannel);
      supabase.removeChannel(arbitrageChannel);
      console.log('Real-time DEX data connection cleaned up');
    };
  }, []); // Empty dependency array to ensure this only runs once

  return {
    marketData,
    arbitrageOpportunities,
    isLoading,
    isConnected,
    lastUpdate,
    refetch: fetchMarketData
  };
};
