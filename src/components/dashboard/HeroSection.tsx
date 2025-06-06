import { useWallet } from "@/contexts/ModernWalletContext";
import { usePortfolioCalculations } from "@/hooks/usePortfolioCalculations";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { MarketData } from "@/types/trading";
import { WifiOff, CheckCircle, AlertCircle, Clock, Database } from "lucide-react";

interface HeroSectionProps {
  marketData: MarketData[];
  isConnected: boolean;
  stats: {
    lastScanTime?: Date;
  };
}

export const HeroSection = ({ marketData, isConnected, stats }: HeroSectionProps) => {
  const { balance } = useWallet();
  const portfolioCalculations = usePortfolioCalculations(marketData, balance);
  const { 
    connectedSources, 
    connectionHealth, 
    isFullyConnected, 
    isPartiallyConnected, 
    isDisconnected,
    hasRecentData,
    getDataAge,
    lastDataUpdate
  } = useConnectionHealth();

  // Determinar mensaje de estado según las conexiones
  let statusMessage = "Verificando conexiones...";
  let statusClass = "text-yellow-400";
  let StatusIcon = AlertCircle;
  
  if (isFullyConnected) {
    statusMessage = "Todas las fuentes conectadas";
    statusClass = "text-green-400";
    StatusIcon = CheckCircle;
  } else if (isPartiallyConnected) {
    statusMessage = `${connectedSources}/2 fuentes conectadas`;
    statusClass = "text-yellow-400";
    StatusIcon = AlertCircle;
  } else if (isDisconnected) {
    statusMessage = "Sin conexión a fuentes de datos";
    statusClass = "text-red-400";
    StatusIcon = WifiOff;
  }

  // Obtener el precio más reciente de ADA para mostrar información relevante
  const adaData = marketData.find(data => data.symbol === 'ADA');
  const dataAge = getDataAge();
  const isDataFresh = hasRecentData();

  // Format data age
  const formatDataAge = (ageMs: number) => {
    if (ageMs < 0) return 'Sin datos';
    const minutes = Math.floor(ageMs / (1000 * 60));
    if (minutes < 1) return 'Ahora mismo';
    if (minutes === 1) return '1 minuto';
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hora' : `${hours} horas`;
  };

  return (
    <div className="glass rounded-2xl p-8 border border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-crypto-primary to-crypto-secondary bg-clip-text text-transparent">
            Cardano Pro Trading Suite
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Trading en tiempo real simplificado con integración de Blockfrost y DeFiLlama para datos confiables del mercado de Cardano.
          </p>
          
          {/* Estado de conexión principal */}
          <div className="flex flex-col space-y-3">
            <div className={`flex items-center space-x-2 ${statusClass}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusMessage}</span>
            </div>
            
            {/* Detalle de fuentes individuales */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-3 py-1 rounded-full border ${
                connectionHealth.blockfrost 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                <span className="flex items-center gap-1">
                  {connectionHealth.blockfrost ? <CheckCircle className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  Blockfrost
                </span>
              </span>
              
              <span className={`px-3 py-1 rounded-full border ${
                connectionHealth.defiLlama 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                <span className="flex items-center gap-1">
                  {connectionHealth.defiLlama ? <CheckCircle className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  DeFiLlama
                </span>
              </span>
            </div>
            
            {/* Información detallada de diagnóstico */}
            <div className="text-sm text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Último escaneo: {stats.lastScanTime?.toLocaleTimeString() || 'Nunca'}</span>
              </div>
              
              {lastDataUpdate && (
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  <span>Datos más recientes: {formatDataAge(dataAge)} atrás</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isDataFresh ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {isDataFresh ? 'Frescos' : 'Antiguos'}
                  </span>
                </div>
              )}
              
              {adaData && (
                <div className="flex items-center gap-2">
                  <span>ADA: ${adaData.price.toFixed(4)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isDataFresh ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {isDataFresh ? 'Actualizado' : 'Datos antiguos'}
                  </span>
                </div>
              )}
              
              {/* Debug info */}
              <div className="text-xs text-gray-500">
                Debug: {connectedSources} fuentes activas, datos de hace {formatDataAge(dataAge)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 lg:mt-0">
          <div className="p-6 rounded-xl bg-gradient-to-br from-crypto-primary/20 to-crypto-secondary/20 border border-crypto-primary/30 glow">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">₳ {balance.toFixed(3)}</div>
              <div className="text-crypto-primary text-sm">Saldo del Wallet</div>
              <div className="text-xs text-gray-400 mt-1">
                ${portfolioCalculations.portfolioValue.toFixed(2)} USD
              </div>
              <div className={`text-xs mt-1 ${portfolioCalculations.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioCalculations.dailyPnL >= 0 ? '+' : ''}${portfolioCalculations.dailyPnL.toFixed(2)} (24h)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
