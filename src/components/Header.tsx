
import { Wifi, WifiOff } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useConnectionHealth } from "@/hooks/useConnectionHealth"
import { useWallet } from "@/contexts/ModernWalletContext"
import { ModernWalletConnector } from "./ModernWalletConnector"
import { ModernWalletInfo } from "./ModernWalletInfo"
import { NetworkIndicator } from "./NetworkIndicator"
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData'
import { RealTimePrice } from "@/components/RealTimePrice"
import { WebSocketStatus } from "@/components/WebSocketStatus"

export function Header() {
  const { connectedSources, isFullyConnected } = useConnectionHealth()
  const { isConnected: walletConnected } = useWallet()
  
  // Use optimized market data for real DEX and protocol data
  const { 
    getTotalDexVolume24h,
    getDEXCount,
    getTopProtocolsByTVL,
    isLoading: dataLoading,
    dataSource,
    lastUpdate
  } = useOptimizedMarketData()
  
  // Get real total DEX volume directly from DeFiLlama data
  const totalVolume24h = getTotalDexVolume24h()
  
  // Count active DEX protocols from real data
  const activeDEXCount = getDEXCount()
  
  // Get top protocols for additional validation
  const topProtocols = getTopProtocolsByTVL(3)
  
  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    } else {
      return volume > 0 ? `$${volume.toFixed(0)}` : 'Cargando...';
    }
  };

  // Determine if we have real data from external APIs
  const hasRealData = !dataLoading && 
                     dataSource !== 'native' && 
                     totalVolume24h > 0 && 
                     activeDEXCount > 0;

  // Check data freshness (within 15 minutes)
  const dataAge = new Date().getTime() - lastUpdate.getTime();
  const isDataFresh = dataAge < 900000; // 15 minutes

  const connectionStatus = hasRealData && isDataFresh;

  return (
    <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="text-white hover:bg-white/10" />
        
        {/* Real-Time Stats from External APIs */}
        <div className="hidden md:flex items-center space-x-6">
          <RealTimePrice />
          
          <div className="text-sm">
            <span className="text-gray-400">DEX Vol 24h: </span>
            <span className="text-white font-mono">
              {formatVolume(totalVolume24h)}
            </span>
            {hasRealData && isDataFresh && (
              <span className="text-xs text-green-400 ml-1">Live</span>
            )}
          </div>
          
          <div className="text-sm">
            <span className="text-gray-400">Protocolos: </span>
            <span className="text-crypto-primary font-mono">{activeDEXCount}</span>
            <span className="text-xs text-gray-500 ml-1">
              {topProtocols.length > 0 ? 'Activos' : 'Cargando'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Indicator */}
        <NetworkIndicator />

        {/* Real-Time Data Status */}
        <WebSocketStatus />

        {/* External API Connection Status */}
        <div className="flex items-center space-x-2">
          {connectionStatus ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs hidden sm:block ${connectionStatus ? 'text-green-400' : 'text-red-400'}`}>
            {connectionStatus ? 'APIs Conectadas' : 'Reconectando'}
          </span>
          <span className="text-xs text-gray-500">
            {connectedSources}/2
          </span>
        </div>

        {/* Modern Wallet Connection */}
        {walletConnected ? <ModernWalletInfo /> : <ModernWalletConnector />}
      </div>
    </header>
  )
}
