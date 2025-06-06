
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionHealth = () => {
  const [connectionHealth, setConnectionHealth] = useState({
    blockfrost: false,
    defiLlama: false
  });
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const updateHealth = async () => {
      try {
        // Verificar datos recientes en cache (últimos 10 minutos)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        
        const { data: recentData, error } = await supabase
          .from('market_data_cache')
          .select('source_dex, timestamp, pair')
          .gte('timestamp', tenMinutesAgo)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error checking connection health:', error);
          setConnectionHealth({ blockfrost: false, defiLlama: false });
          return;
        }

        // Analizar las fuentes de datos disponibles
        const sources = new Set<string>();
        let mostRecentUpdate: Date | null = null;

        if (recentData && recentData.length > 0) {
          recentData.forEach(item => {
            const sourceName = item.source_dex?.toLowerCase() || '';
            sources.add(sourceName);
            
            const itemDate = new Date(item.timestamp);
            if (!mostRecentUpdate || itemDate > mostRecentUpdate) {
              mostRecentUpdate = itemDate;
            }
          });
        }

        // Determinar el estado de cada fuente
        const hasBlockfrost = sources.has('blockfrost') || 
                            Array.from(sources).some(s => s.includes('blockfrost'));
        
        const hasDefiLlama = sources.has('defillama') || 
                           Array.from(sources).some(s => s.includes('defillama'));

        setConnectionHealth({
          blockfrost: hasBlockfrost,
          defiLlama: hasDefiLlama
        });

        setLastDataUpdate(mostRecentUpdate);

        console.log('📊 Connection health updated:', {
          blockfrost: hasBlockfrost,
          defiLlama: hasDefiLlama,
          recentDataCount: recentData?.length || 0,
          sourcesFound: Array.from(sources),
          lastUpdate: mostRecentUpdate?.toISOString()
        });

      } catch (error) {
        console.error('❌ Error updating connection health:', error);
        setConnectionHealth({ blockfrost: false, defiLlama: false });
      }
    };

    // Trigger edge function to ensure fresh data
    const triggerDataFetch = async () => {
      try {
        console.log('🔄 Triggering data fetch to update connection status...');
        await supabase.functions.invoke('fetch-dex-data', {
          body: JSON.stringify({ action: 'fetch_all' })
        });
      } catch (error) {
        console.error('❌ Error triggering data fetch:', error);
      }
    };

    // Actualizar inmediatamente
    updateHealth();
    
    // Trigger data fetch initially
    triggerDataFetch();
    
    // Actualizar cada 30 segundos
    const healthInterval = setInterval(updateHealth, 30000);
    
    // Trigger data fetch every 2 minutes
    const fetchInterval = setInterval(triggerDataFetch, 120000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(fetchInterval);
    };
  }, []);

  const connectedSources = Object.values(connectionHealth).filter(Boolean).length;
  
  return { 
    connectionHealth, 
    connectedSources,
    lastDataUpdate,
    isFullyConnected: connectedSources === 2,
    isPartiallyConnected: connectedSources > 0 && connectedSources < 2,
    isDisconnected: connectedSources === 0,
    
    // Utility methods
    hasRecentData: () => {
      if (!lastDataUpdate) return false;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastDataUpdate > fiveMinutesAgo;
    },
    
    getDataAge: () => {
      if (!lastDataUpdate) return -1;
      return Date.now() - lastDataUpdate.getTime();
    }
  };
};
