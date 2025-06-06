
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { realTimeWebSocketService } from '@/services/realTimeWebSocketService';

interface ConnectionStatus {
  endpoint: string;
  connected: boolean;
  reconnectAttempts: number;
  lastSeen?: Date;
}

export const WebSocketStatus = () => {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [overallStatus, setOverallStatus] = useState<'connected' | 'partial' | 'disconnected'>('disconnected');

  useEffect(() => {
    const updateStatus = () => {
      const endpoints = ['price_updates', 'arbitrage_updates', 'dex_status'];
      const statuses: ConnectionStatus[] = endpoints.map(endpoint => {
        const status = realTimeWebSocketService.getConnectionStatus(endpoint);
        return {
          endpoint,
          connected: status.connected,
          reconnectAttempts: status.reconnectAttempts,
          lastSeen: status.connected ? new Date() : undefined
        };
      });

      setConnections(statuses);

      // Determine overall status
      const connectedCount = statuses.filter(s => s.connected).length;
      if (connectedCount === statuses.length) {
        setOverallStatus('connected');
      } else if (connectedCount > 0) {
        setOverallStatus('partial');
      } else {
        setOverallStatus('disconnected');
      }
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <Wifi className="h-3 w-3 text-green-400" />
    ) : (
      <WifiOff className="h-3 w-3 text-red-400" />
    );
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
          {overallStatus === 'connected' ? 'Real-Time' : 
           overallStatus === 'partial' ? 'Partial' : 'Offline'}
        </span>
      </div>

      {/* Detailed Connection Info (Hidden on mobile) */}
      <div className="hidden md:flex items-center space-x-2">
        {connections.map(conn => (
          <div key={conn.endpoint} className="flex items-center space-x-1" title={conn.endpoint}>
            {getStatusIcon(conn.connected)}
            {conn.reconnectAttempts > 0 && (
              <span className="text-xs text-orange-400">
                {conn.reconnectAttempts}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Last Update Time */}
      <div className="flex items-center space-x-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
