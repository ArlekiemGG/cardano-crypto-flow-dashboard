
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Zap, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { SystemDiagnostics } from './SystemDiagnostics';

export const OptimizedDataDashboard = () => {
  const {
    prices,
    protocols,
    dexVolumes,
    isLoading,
    lastUpdate,
    dataSource,
    cacheStats,
    forceRefresh,
    getADAPrice,
    getTopProtocolsByTVL,
    getTotalCardanoTVL,
    getTotalDexVolume24h,
    hasErrors,
    errorDetails
  } = useOptimizedMarketData();

  const adaPrice = getADAPrice();
  const topProtocols = getTopProtocolsByTVL(5);
  const totalTVL = getTotalCardanoTVL();
  const totalDexVolume = getTotalDexVolume24h();

  const getSourceBadgeColor = () => {
    switch (dataSource) {
      case 'defillama': return 'bg-green-500';
      case 'native': return 'bg-orange-500';
      case 'mixed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Diagnostics Section */}
      <SystemDiagnostics />

      {/* Error Alert */}
      {hasErrors && errorDetails.length > 0 && (
        <Card className="glass border-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Errores Detectados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errorDetails.map((error, index) => (
                <div key={index} className="text-sm text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header con métricas del sistema */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-crypto-primary" />
              <span>Sistema Optimizado de Datos</span>
              <Badge className={getSourceBadgeColor()}>
                {dataSource.toUpperCase()}
              </Badge>
              {hasErrors && (
                <Badge variant="destructive">
                  {errorDetails.length} Errores
                </Badge>
              )}
            </div>
            <Button 
              onClick={forceRefresh} 
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-400">Cache Hit Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {((cacheStats.hitRate || 0) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-400">Volumen DEX 24h</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                ${totalDexVolume > 1000000 ? (totalDexVolume / 1000000).toFixed(1) + 'M' : (totalDexVolume / 1000).toFixed(0) + 'K'}
              </div>
              <div className="text-xs text-gray-400">Datos de DeFiLlama</div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-crypto-primary" />
                <span className="text-sm text-gray-400">ADA Price</span>
              </div>
              <div className="text-2xl font-bold text-crypto-primary">
                ${adaPrice.toFixed(4)}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-400">Total TVL</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                ${(totalTVL / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Última actualización:</span>
              <span className="text-white">{lastUpdate.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">Fuente principal:</span>
              <span className="text-crypto-primary font-medium">
                {dataSource === 'defillama' ? 'DeFiLlama API' : 
                 dataSource === 'native' ? 'APIs Nativas' : 
                 'Mixto (DeFiLlama + Nativas)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">Estado del sistema:</span>
              <span className={`font-medium ${hasErrors ? 'text-red-400' : 'text-green-400'}`}>
                {hasErrors ? `${errorDetails.length} errores detectados` : 'Funcionando correctamente'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Protocolos */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Top Protocolos Cardano (TVL)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProtocols.map((protocol, index) => (
              <div key={protocol.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-crypto-primary/20 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{protocol.name}</div>
                    <div className="text-xs text-gray-400">
                      {protocol.chains?.join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-crypto-primary font-bold">
                    ${(protocol.tvl / 1000000).toFixed(1)}M
                  </div>
                  <div className={`text-xs ${protocol.change_1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {protocol.change_1d >= 0 ? '+' : ''}{protocol.change_1d?.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DEX Volumes - Solo datos de DeFiLlama */}
      {dexVolumes?.protocols && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Volúmenes DEX Cardano (24h)</span>
              <Badge variant="outline" className="text-xs">
                DeFiLlama: ${totalDexVolume > 1000000 ? (totalDexVolume / 1000000).toFixed(2) + 'M' : (totalDexVolume / 1000).toFixed(0) + 'K'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dexVolumes.protocols.slice(0, 6).map((dex: any) => (
                <div key={dex.name} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-white font-medium">{dex.name}</div>
                  <div className="text-crypto-primary font-mono text-lg">
                    ${dex.total24h > 1000000 ? (dex.total24h / 1000000).toFixed(2) + 'M' : (dex.total24h / 1000).toFixed(0) + 'K'}
                  </div>
                  <div className={`text-xs ${dex.change_1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dex.change_1d >= 0 ? '+' : ''}{dex.change_1d?.toFixed(2)}% (24h)
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Fuente: DeFiLlama
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
