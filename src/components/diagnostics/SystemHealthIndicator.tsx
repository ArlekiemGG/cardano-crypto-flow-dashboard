
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  services: {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    lastCheck: Date;
  }[];
  performance: {
    responseTime: number;
    uptime: number;
  };
}

export const SystemHealthIndicator = () => {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    services: [],
    performance: { responseTime: 0, uptime: 100 }
  });

  useEffect(() => {
    const checkSystemHealth = () => {
      // Simulate health check
      const services = [
        { name: 'Market Data', status: 'online' as const, lastCheck: new Date() },
        { name: 'Wallet Connection', status: 'online' as const, lastCheck: new Date() },
        { name: 'DEX APIs', status: 'degraded' as const, lastCheck: new Date() },
        { name: 'Database', status: 'online' as const, lastCheck: new Date() }
      ];

      const hasErrors = services.some(s => s.status === 'offline');
      const hasWarnings = services.some(s => s.status === 'degraded');

      setHealth({
        status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy',
        services,
        performance: {
          responseTime: Math.floor(Math.random() * 500) + 100,
          uptime: 99.8
        }
      });
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
      case 'offline':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
      case 'offline':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-crypto-primary" />
            <span>System Health</span>
          </span>
          <Badge className={getStatusColor(health.status)}>
            {getStatusIcon(health.status)}
            <span className="ml-1 capitalize">{health.status}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400">Response Time</div>
            <div className="text-lg font-mono text-white">
              {health.performance.responseTime}ms
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400">Uptime</div>
            <div className="text-lg font-mono text-white">
              {health.performance.uptime}%
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-300">Services</div>
          {health.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-sm text-white">{service.name}</span>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(service.status)} text-xs`}>
                  {getStatusIcon(service.status)}
                  <span className="ml-1 capitalize">{service.status}</span>
                </Badge>
                <span className="text-xs text-gray-500">
                  {service.lastCheck.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
