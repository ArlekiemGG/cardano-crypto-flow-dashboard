
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';

interface ConnectionStatus {
  endpoint: string;
  connected: boolean;
  dataAge: number;
  lastSeen?: Date;
}

export const WebSocketStatus = () => {
  const { isLoading, lastUpdate, dataSource } = useOptimizedMarketData();
  const [overallStatus, setOverallStatus] = useState<'connected' | 'partial' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (isLoading) {
      setOverallStatus('disconnected');
      return;
    }

    // Calculate data freshness
    const now = new Date();
    const dataAge = now.getTime() - lastUpdate.getTime();
    const isFresh = dataAge < 300000; // 5 minutes

    if (isFresh && dataSource !== 'native') {
      setOverallStatus('connected');
    } else if (dataAge < 600000) { // 10 minutes
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
      case 'connected': return 'Datos Reales';
      case 'partial': return 'Datos Parciales';
      case 'disconnected': return 'Sin Conexión';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Overall Status Indicator */}
      <div className="flex items-center space-x-1">
        {overallStatus === 'connected' ? (
          <Activity className="h-4 w-4 text-green-400 animate-pulse" />
        ) : overallStatus === 'partial' ? (
          <Activity className="h-4 w-4 text-yellow-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-400" />
        )}
        
        <span className={`text-xs ${getStatusColor(overallStatus)}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Data Source Info */}
      <div className="hidden md:flex items-center space-x-1">
        <span className="text-xs text-gray-500">
          {dataSource === 'defillama' ? 'DeFiLlama' : 
           dataSource === 'mixed' ? 'Mixto' : 'Local'}
        </span>
      </div>

      {/* Last Update Time */}
      <div className="flex items-center space-x-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{lastUpdate.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
