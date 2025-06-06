
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { useUnifiedMarketData } from '@/hooks/useUnifiedMarketData';

export const WebSocketStatus = () => {
  const { isLoading, lastUpdate, dataSource, cacheStats } = useUnifiedMarketData();
  const [overallStatus, setOverallStatus] = useState<'connected' | 'partial' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (isLoading) {
      setOverallStatus('disconnected');
      return;
    }

    const now = new Date();
    const dataAge = now.getTime() - lastUpdate.getTime();
    const isFresh = dataAge < 300000; // 5 minutes
    const isPartialFresh = dataAge < 900000; // 15 minutes

    if (dataSource === 'defillama' && isFresh) {
      setOverallStatus('connected');
    } else if (dataSource === 'mixed' && isPartialFresh) {
      setOverallStatus('partial');
    } else if (dataSource !== 'native' && isPartialFresh) {
      setOverallStatus('partial');
    } else {
      setOverallStatus('disconnected');
    }
  }, [isLoading, lastUpdate, dataSource]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Cargando...';
    
    switch (overallStatus) {
      case 'connected': return 'Datos en Vivo';
      case 'partial': return 'Datos Parciales';
      case 'disconnected': return 'Sin Conexión';
      default: return 'Desconocido';
    }
  };

  const hitRate = cacheStats?.hitRate || 0;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {overallStatus === 'connected' ? (
          <Activity className="h-4 w-4 text-green-400 animate-pulse" />
        ) : overallStatus === 'partial' ? (
          <Wifi className="h-4 w-4 text-yellow-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-400" />
        )}
        
        <span className={`text-xs ${getStatusColor(overallStatus)}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="hidden md:flex items-center space-x-1">
        <span className="text-xs text-gray-500">
          {dataSource === 'defillama' ? 'DeFiLlama' : 
           dataSource === 'mixed' ? 'APIs Mixtas' : 'Cache Local'}
        </span>
        {hitRate > 0 && (
          <span className="text-xs text-gray-400">
            ({(hitRate * 100).toFixed(0)}%)
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{lastUpdate.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
