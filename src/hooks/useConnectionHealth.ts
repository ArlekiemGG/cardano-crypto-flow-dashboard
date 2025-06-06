
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionHealth = () => {
  const [connectionHealth, setConnectionHealth] = useState({
    blockfrost: false,
    defiLlama: false
  });

  useEffect(() => {
    const updateHealth = async () => {
      try {
        // Verificar datos recientes en cache para determinar conectividad
        const { data: recentData, error } = await supabase
          .from('market_data_cache')
          .select('source_dex, timestamp')
          .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Últimos 10 minutos
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error checking connection health:', error);
          setConnectionHealth({ blockfrost: false, defiLlama: false });
          return;
        }

        const sources = new Set(recentData?.map(item => item.source_dex.toLowerCase()) || []);
        
        setConnectionHealth({
          blockfrost: sources.has('blockfrost'),
          defiLlama: sources.has('defillama')
        });

        console.log('📊 Connection health updated:', {
          blockfrost: sources.has('blockfrost'),
          defiLlama: sources.has('defillama'),
          recentDataCount: recentData?.length || 0
        });

      } catch (error) {
        console.error('❌ Error updating connection health:', error);
        setConnectionHealth({ blockfrost: false, defiLlama: false });
      }
    };

    // Actualizar inmediatamente
    updateHealth();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(updateHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const connectedSources = Object.values(connectionHealth).filter(Boolean).length;
  
  return { 
    connectionHealth, 
    connectedSources,
    isFullyConnected: connectedSources === 2,
    isPartiallyConnected: connectedSources > 0 && connectedSources < 2,
    isDisconnected: connectedSources === 0
  };
};
