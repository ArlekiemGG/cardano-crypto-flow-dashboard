
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';

interface DiagnosticResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

export const SimplifiedDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runQuickDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    
    const results: DiagnosticResult[] = [];
    const timestamp = new Date().toLocaleTimeString();

    try {
      // Test Supabase connection
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('count(*)')
        .limit(1);

      if (error) {
        results.push({
          service: 'Supabase',
          status: 'error',
          message: `Error de conexión: ${error.message}`,
          timestamp
        });
      } else {
        results.push({
          service: 'Supabase',
          status: 'success',
          message: 'Conexión exitosa',
          timestamp
        });
      }

      // Test data freshness
      const { data: recentData } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (recentData && recentData.length > 0) {
        results.push({
          service: 'Datos',
          status: 'success',
          message: `${recentData.length} entradas recientes encontradas`,
          timestamp
        });
      } else {
        results.push({
          service: 'Datos',
          status: 'warning',
          message: 'No se encontraron datos recientes',
          timestamp
        });
      }

      // Test edge function
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('fetch-dex-data', {
          body: JSON.stringify({ action: 'fetch_all' })
        });

        if (edgeError) {
          results.push({
            service: 'Edge Function',
            status: 'error',
            message: `Error: ${edgeError.message}`,
            timestamp
          });
        } else {
          results.push({
            service: 'Edge Function',
            status: 'success',
            message: 'Respuesta exitosa',
            timestamp
          });
        }
      } catch (error) {
        results.push({
          service: 'Edge Function',
          status: 'error',
          message: `Error: ${error}`,
          timestamp
        });
      }

    } catch (error) {
      results.push({
        service: 'Sistema',
        status: 'error',
        message: `Error crítico: ${error}`,
        timestamp
      });
    } finally {
      setDiagnostics(results);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runQuickDiagnostics();
  }, []);

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
    }
  };

  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-crypto-primary" />
            <span>Diagnóstico Rápido</span>
          </div>
          <Button 
            onClick={runQuickDiagnostics} 
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Ejecutando...' : 'Ejecutar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{successCount}</div>
            <div className="text-xs text-gray-400">Exitosos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
            <div className="text-xs text-gray-400">Errores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
            <div className="text-xs text-gray-400">Advertencias</div>
          </div>
        </div>
        
        <div className="space-y-2">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5">
              <div className="flex items-center space-x-2">
                {getStatusIcon(diagnostic.status)}
                <span className="text-white font-medium">{diagnostic.service}</span>
              </div>
              <div className="text-right">
                <div className={`text-sm ${getStatusColor(diagnostic.status)}`}>
                  {diagnostic.message}
                </div>
                <div className="text-xs text-gray-500">
                  {diagnostic.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
