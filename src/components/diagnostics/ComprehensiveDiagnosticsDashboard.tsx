
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Activity, Database, Zap, Globe } from 'lucide-react';
import { systemDiagnostics } from '@/services/comprehensive-diagnostics/SystemDiagnosticsService';

interface DiagnosticResult {
  service: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  data?: any;
  latency?: number;
}

interface ComprehensiveDiagnostic {
  timestamp: string;
  overallHealth: 'healthy' | 'degraded' | 'critical';
  results: DiagnosticResult[];
  recommendations: string[];
  dataQuality: {
    realTimeDataAvailable: boolean;
    apiCoverage: number;
    dataFreshness: number;
  };
}

export const ComprehensiveDiagnosticsDashboard = () => {
  const [diagnosis, setDiagnosis] = useState<ComprehensiveDiagnostic | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnosis = async () => {
    setIsRunning(true);
    try {
      console.log('🔍 Running comprehensive diagnosis...');
      const result = await systemDiagnostics.performComprehensiveDiagnosis();
      setDiagnosis(result);
      setLastRun(new Date());
      console.log('✅ Diagnosis completed:', result);
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run diagnosis on component mount
    runDiagnosis();
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getServiceIcon = (service: string) => {
    if (service.includes('Database')) return <Database className="h-4 w-4" />;
    if (service.includes('Edge Function')) return <Zap className="h-4 w-4" />;
    if (service.includes('Real-time')) return <Activity className="h-4 w-4" />;
    if (service.includes('API')) return <Globe className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-crypto-primary" />
              <span>Diagnóstico Completo del Sistema</span>
            </CardTitle>
            <Button 
              onClick={runDiagnosis} 
              disabled={isRunning}
              className="bg-crypto-primary hover:bg-crypto-secondary"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ejecutar Diagnóstico
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {diagnosis && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getHealthColor(diagnosis.overallHealth)}`}>
                  {diagnosis.overallHealth.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400">Estado General</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-crypto-primary">
                  {diagnosis.dataQuality.apiCoverage.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-400">Cobertura de APIs</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-crypto-secondary">
                  {(diagnosis.dataQuality.dataFreshness * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-400">Datos Actualizados</div>
              </div>
            </div>
            
            {lastRun && (
              <div className="text-xs text-gray-500 mt-4 text-center">
                Última ejecución: {lastRun.toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Service Status */}
      {diagnosis && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Estado de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnosis.results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center space-x-3">
                    {getServiceIcon(result.service)}
                    <div>
                      <div className="font-medium text-white">{result.service}</div>
                      <div className="text-sm text-gray-400">{result.message}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {result.latency && (
                      <Badge variant="outline" className="text-xs">
                        {result.latency}ms
                      </Badge>
                    )}
                    {getStatusIcon(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Details */}
      {diagnosis && diagnosis.results.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Detalles de Calidad de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {diagnosis.results.map((result, index) => (
                result.data && (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-crypto-primary">{result.service}</h4>
                    <div className="text-sm space-y-1">
                      {Object.entries(result.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="text-white">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {diagnosis && diagnosis.recommendations.length > 0 && (
        <Card className="glass border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-400">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {diagnosis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
