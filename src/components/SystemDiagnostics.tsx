
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Database, Zap, Activity } from 'lucide-react';
import { dataFlowDiagnostics } from '@/services/DataFlowDiagnostics';

export const SystemDiagnostics = () => {
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      const report = await dataFlowDiagnostics.performFullDiagnosis();
      setDiagnosticReport(report);
      setLogs(report.logs);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run initial diagnostics
    runDiagnostics();
  }, []);

  const getStatusIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getLogType = (log: string) => {
    if (log.includes('✅')) return 'success';
    if (log.includes('❌')) return 'error';
    if (log.includes('⚠️')) return 'warning';
    return 'info';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-crypto-primary" />
              <span>Diagnóstico del Sistema</span>
            </div>
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagnosticReport && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">Exitosos</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {diagnosticReport.summary.passed}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-400">Fallidos</span>
                </div>
                <div className="text-2xl font-bold text-red-400">
                  {diagnosticReport.summary.failed}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Advertencias</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {diagnosticReport.summary.warnings}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Logs */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-crypto-primary" />
            <span>Registro de Diagnóstico</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => {
                const type = getLogType(log);
                return (
                  <div 
                    key={index} 
                    className="flex items-start space-x-2 p-2 rounded bg-white/5 border border-white/10"
                  >
                    {getStatusIcon(type)}
                    <span className="text-sm text-gray-300 font-mono flex-1">
                      {log}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">No hay registros disponibles</div>
                <div className="text-xs text-gray-500">
                  Ejecuta un diagnóstico para ver los resultados
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
