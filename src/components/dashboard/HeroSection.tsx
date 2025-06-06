
import { useWallet } from "@/contexts/ModernWalletContext";
import { usePortfolioCalculations } from "@/hooks/usePortfolioCalculations";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { MarketData } from "@/types/trading";
import { WifiOff } from "lucide-react";

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
  const { connectedSources, connectionHealth, isFullyConnected, isPartiallyConnected, isDisconnected } = useConnectionHealth();

  // Determinar mensaje de estado según las conexiones
  let statusMessage = "Conectando a fuentes de datos...";
  let statusClass = "text-yellow-400";
  
  if (isFullyConnected) {
    statusMessage = "2/2 Fuentes Conectadas";
    statusClass = "text-green-400";
  } else if (isPartiallyConnected) {
    statusMessage = `${connectedSources}/2 Fuentes Conectadas`;
    statusClass = "text-yellow-400";
  } else if (isDisconnected) {
    statusMessage = "Sin conexión a fuentes de datos";
    statusClass = "text-red-400";
  }

  return (
    <div className="glass rounded-2xl p-8 border border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-crypto-primary to-crypto-secondary bg-clip-text text-transparent">
            Cardano Pro Trading Suite
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Simplified real-time trading with Blockfrost and DeFiLlama integration for reliable Cardano market data.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className={`flex items-center space-x-2 ${statusClass}`}>
              <div className={`w-3 h-3 rounded-full ${isDisconnected ? 'bg-red-400' : isFullyConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
              <span className="text-sm font-medium">
                {statusMessage}
              </span>
            </div>
            
            {isPartiallyConnected && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {connectionHealth.blockfrost ? (
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    Blockfrost ✓
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center">
                    <WifiOff className="w-3 h-3 mr-1" /> Blockfrost
                  </span>
                )}
                
                {connectionHealth.defiLlama ? (
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    DeFiLlama ✓
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center">
                    <WifiOff className="w-3 h-3 mr-1" /> DeFiLlama
                  </span>
                )}
              </div>
            )}
            
            <div className="text-sm text-gray-400">
              Last scan: {stats.lastScanTime?.toLocaleTimeString() || 'Never'}
            </div>
          </div>
        </div>
        
        <div className="mt-6 lg:mt-0">
          <div className="p-6 rounded-xl bg-gradient-to-br from-crypto-primary/20 to-crypto-secondary/20 border border-crypto-primary/30 glow">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">₳ {balance.toFixed(3)}</div>
              <div className="text-crypto-primary text-sm">Wallet Balance</div>
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
