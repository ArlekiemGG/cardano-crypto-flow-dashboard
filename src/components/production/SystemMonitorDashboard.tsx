
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { realTimeMonitoring, HealthCheck } from '@/services/realTimeMonitoring';
import { performanceOptimizer } from '@/services/performanceOptimizer';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Server, 
  Zap,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

export const SystemMonitorDashboard: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      const [health, status, metrics] = await Promise.all([
        realTimeMonitoring.monitorAPIHealth(),
        realTimeMonitoring.getSystemStatus(),
        realTimeMonitoring.trackPerformanceMetrics()
      ]);

      setHealthChecks(health);
      setSystemStatus(status);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error loading system data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSystemData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/20';
      case 'degraded': return 'text-yellow-400 bg-yellow-400/20';
      case 'down': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'down': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">System Monitor</h2>
          <p className="text-gray-400">Real-time production monitoring</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.overall)}
                <div>
                  <p className="text-sm text-gray-400">Overall Status</p>
                  <Badge className={getStatusColor(systemStatus.overall)}>
                    {systemStatus.overall.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Services</p>
                  <p className="text-lg font-bold text-white">
                    {systemStatus.services?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Active Alerts</p>
                  <p className="text-lg font-bold text-white">
                    {systemStatus.alerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Error Rate</p>
                  <p className="text-lg font-bold text-white">
                    {performanceMetrics?.errorRate?.toFixed(1) || '0.0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Health Checks */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-crypto-primary" />
            <span>API Health Checks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthChecks.map((check) => (
              <div key={check.service} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium text-white">{check.service}</p>
                    <p className="text-sm text-gray-400">
                      Last checked: {new Date(check.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(check.status)}>
                    {check.status.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-400 mt-1">
                    {check.latency}ms
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span>API Latency</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(performanceMetrics.apiLatency).map(([service, latency]) => (
                  <div key={service} className="flex justify-between items-center">
                    <span className="text-gray-300">{service}</span>
                    <span className="text-white font-mono">{latency}ms</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span>Performance Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Throughput (1h)</span>
                  <span className="text-white font-bold">{performanceMetrics.throughput} tx/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Error Rate</span>
                  <span className={`font-bold ${performanceMetrics.errorRate > 5 ? 'text-red-400' : 'text-green-400'}`}>
                    {performanceMetrics.errorRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Cache Hit Rate</span>
                  <span className="text-green-400 font-bold">85%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
