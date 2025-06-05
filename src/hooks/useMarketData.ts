
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { dexService } from '@/services/dexService';
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
      
      // Fetch live prices from DEXs
      const dexPrices = await dexService.getAllDEXPrices();
      
      if (dexPrices.length > 0) {
        // Update market data cache
        await dexService.updateMarketDataCache(dexPrices);
        
        // Detect arbitrage opportunities
        const opportunities = await dexService.detectArbitrageOpportunities(dexPrices);
        
        if (opportunities.length > 0) {
          await dexService.saveArbitrageOpportunities(opportunities);
        }
        
        setIsConnected(true);
      }

      // Fetch cached market data from database
      const { data: cachedData } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false });

      if (cachedData) {
        const formattedData: MarketData[] = cachedData.map(item => ({
          symbol: item.pair.split('/')[0],
          price: Number(item.price),
          change24h: Number(item.change_24h) || 0,
          volume24h: Number(item.volume_24h) || 0,
          marketCap: Number(item.market_cap) || 0,
          lastUpdate: item.timestamp || new Date().toISOString()
        }));

        setMarketData(formattedData);
      }

      // Fetch active arbitrage opportunities
      const { data: arbitrageData } = await supabase
        .from('arbitrage_opportunities')
        .select('*')
        .eq('is_active', true)
        .order('profit_potential', { ascending: false })
        .limit(10);

      if (arbitrageData) {
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
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMarketData();

    // Set up real-time subscriptions
    const marketDataChannel = supabase
      .channel('market-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_data_cache'
        },
        () => fetchMarketData()
      )
      .subscribe();

    const arbitrageChannel = supabase
      .channel('arbitrage-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arbitrage_opportunities'
        },
        () => fetchMarketData()
      )
      .subscribe();

    // Periodic updates every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(marketDataChannel);
      supabase.removeChannel(arbitrageChannel);
    };
  }, []);

  return {
    marketData,
    arbitrageOpportunities,
    isLoading,
    isConnected,
    lastUpdate,
    refetch: fetchMarketData
  };
};
