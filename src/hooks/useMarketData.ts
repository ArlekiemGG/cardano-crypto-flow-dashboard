
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { blockfrostService } from '@/services/blockfrostService';
import { MarketData, ArbitrageOpportunity } from '@/types/trading';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const channelsRef = useRef<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching ADA data from cached database...');
      
      // CAMBIO IMPORTANTE: Solo leer de la cache, no escribir
      // El edge function se encarga de mantener los datos actualizados
      const { data: cachedADA, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('pair', 'ADA/USD')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedADA && !error) {
        const adaMarketData: MarketData = {
          symbol: 'ADA',
          price: Number(cachedADA.price),
          change24h: Number(cachedADA.change_24h) || 0,
          volume24h: Number(cachedADA.volume_24h) || 0,
          marketCap: Number(cachedADA.market_cap) || 0,
          lastUpdate: cachedADA.timestamp || new Date().toISOString()
        };

        setMarketData([adaMarketData]);
        setIsConnected(true);
        console.log('✅ ADA data loaded from cache:', adaMarketData);
      } else {
        console.log('📊 No cached ADA data found, triggering edge function...');
        
        // Solo disparar el edge function, no cachear nosotros mismos
        await supabase.functions.invoke('fetch-dex-data', {
          body: JSON.stringify({ action: 'fetch_all' })
        });
        
        // Intentar leer de nuevo después de disparar el edge function
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('market_data_cache')
            .select('*')
            .eq('pair', 'ADA/USD')
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (retryData) {
            const adaMarketData: MarketData = {
              symbol: 'ADA',
              price: Number(retryData.price),
              change24h: Number(retryData.change_24h) || 0,
              volume24h: Number(retryData.volume_24h) || 0,
              marketCap: Number(retryData.market_cap) || 0,
              lastUpdate: retryData.timestamp || new Date().toISOString()
            };
            setMarketData([adaMarketData]);
            setIsConnected(true);
          }
        }, 3000);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error fetching market data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupChannels = () => {
    console.log(`🧹 Cleaning up ${channelsRef.current.length} channels...`);
    channelsRef.current.forEach(channel => {
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error cleaning up channel:', error);
      }
    });
    channelsRef.current = [];
  };

  const clearInterval = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('useMarketData already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing market data connection (read-only mode)...');
    isInitializedRef.current = true;
    
    // Initial fetch
    fetchMarketData();

    // Periodic updates every 2 minutes (menos frecuente para evitar conflictos)
    intervalRef.current = setInterval(() => {
      console.log('🔄 Periodic market data refresh...');
      fetchMarketData();
    }, 120000); // 2 minutos en lugar de 1

    return () => {
      console.log('🧹 useMarketData cleanup initiated...');
      cleanupChannels();
      clearInterval();
      isInitializedRef.current = false;
      console.log('✅ useMarketData cleanup completed');
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
