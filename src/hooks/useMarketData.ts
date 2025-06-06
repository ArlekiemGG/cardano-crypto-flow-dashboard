
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketData, ArbitrageOpportunity } from '@/types/trading';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const channelRef = useRef<any>(null);
  const isFetchingRef = useRef(false);

  const fetchMarketData = async () => {
    // Prevenir fetch simultáneos
    if (isFetchingRef.current) {
      console.log('⏭️ Fetch ya en progreso, saltando...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      console.log('📊 Fetching market data (instancia única)...');
      
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: cachedData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', fifteenMinutesAgo)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error fetching market data:', error);
        setIsConnected(false);
        return;
      }

      if (cachedData && cachedData.length > 0) {
        console.log(`📊 Procesando ${cachedData.length} entradas de datos...`);
        
        const processedData: MarketData[] = [];
        const seenPairs = new Map<string, any>();

        const sortedData = cachedData.sort((a, b) => {
          const sourceRanking = (source: string) => {
            if (source === 'CoinGecko') return 3;
            if (source === 'DeFiLlama') return 2;
            return 1;
          };
          return sourceRanking(b.source_dex) - sourceRanking(a.source_dex);
        });

        sortedData.forEach((item) => {
          if (item.pair && (item.pair.includes('ADA') || item.pair.includes('CARDANO')) && item.price > 0) {
            const pairKey = 'ADA';
            
            if (item.price !== 1 && item.price > 0.1 && item.price < 10) {
              const existing = seenPairs.get(pairKey);
              
              if (!existing || 
                  new Date(item.timestamp) > new Date(existing.timestamp) ||
                  (item.source_dex === 'CoinGecko' && existing.source_dex !== 'CoinGecko')) {
                
                seenPairs.set(pairKey, {
                  symbol: 'ADA',
                  price: Number(item.price),
                  change24h: Number(item.change_24h) || 0,
                  volume24h: Number(item.volume_24h) || 0,
                  marketCap: Number(item.market_cap) || 0,
                  lastUpdate: item.timestamp,
                  source: item.source_dex
                });
              }
            }
          }
        });

        const finalData = Array.from(seenPairs.values());
        
        if (finalData.length > 0) {
          setMarketData(finalData);
          setIsConnected(true);
          console.log(`✅ Market data actualizado: ${finalData.length} tokens`);
        } else {
          console.log('⚠️ No hay datos válidos, triggerando refresh...');
          await triggerDataRefresh();
        }
      } else {
        console.log('📊 No hay datos recientes, triggerando refresh...');
        await triggerDataRefresh();
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error en fetchMarketData:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const triggerDataRefresh = async () => {
    try {
      console.log('🔄 Triggerando refresh de datos...');
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        console.error('❌ Error en edge function:', error);
      } else {
        console.log('✅ Refresh completado:', data);
        setTimeout(() => {
          fetchMarketData();
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error triggerando refresh:', error);
    }
  };

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('⚠️ useMarketData ya inicializado, saltando...');
      return;
    }

    console.log('🚀 Inicializando market data service ÚNICO...');
    isInitializedRef.current = true;
    
    // Fetch inicial
    fetchMarketData();

    // Interval más conservador para evitar sobrecargar
    intervalRef.current = setInterval(() => {
      console.log('🔄 Refresh periódico de market data...');
      fetchMarketData();
    }, 300000); // 5 minutos en lugar de 3

    // Limpiar canal existente
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error limpiando canal existente:', error);
      }
    }

    // Suscripción real-time con debounce
    let debounceTimer: NodeJS.Timeout;
    channelRef.current = supabase
      .channel(`market_data_unique_${Date.now()}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'market_data_cache' 
        }, 
        (payload) => {
          console.log('📊 Update real-time recibido');
          
          // Debounce para evitar múltiples updates
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchMarketData();
          }, 5000); // 5 segundos de debounce
        }
      );

    channelRef.current.subscribe((status: string) => {
      console.log('📊 Suscripción real-time:', status);
    });

    return () => {
      console.log('🧹 Limpieza de useMarketData...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (error) {
          console.error('Error limpiando canal:', error);
        }
      }
      
      isInitializedRef.current = false;
      isFetchingRef.current = false;
      console.log('✅ Limpieza completada');
    };
  }, []);

  return {
    marketData,
    arbitrageOpportunities,
    isLoading,
    isConnected,
    lastUpdate,
    refetch: fetchMarketData,
    triggerRefresh: triggerDataRefresh
  };
};
