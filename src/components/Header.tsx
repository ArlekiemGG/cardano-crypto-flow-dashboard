
import { Wifi, WifiOff } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useConnectionHealth } from "@/hooks/useConnectionHealth"
import { useWallet } from "@/contexts/ModernWalletContext"
import { ModernWalletConnector } from "./ModernWalletConnector"
import { ModernWalletInfo } from "./ModernWalletInfo"
import { NetworkIndicator } from "./NetworkIndicator"
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData'
import { RealTimePrice } from "@/components/RealTimePrice"

export function Header() {
  const { connectedSources, isFullyConnected } = useConnectionHealth()
  const { isConnected: walletConnected } = useWallet()
  
  // Use the optimized market data hook for real DEX data
  const { 
    dexVolumes,
    isLoading: dexLoading,
    getTotalDexVolume24h
  } = useOptimizedMarketData()
  
  // Get real total DEX volume
  const totalVolume24h = getTotalDexVolume24h()
  
  // Count active DEX pairs from real data
  const activeDEXPairs = dexVolumes?.protocols?.length || 0
  
  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    } else {
      return volume > 0 ? `$${volume.toFixed(0)}` : 'Loading...';
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="text-white hover:bg-white/10" />
        
        {/* Real-Time Stats */}
        <div className="hidden md:flex items-center space-x-6">
          <RealTimePrice />
          
          <div className="text-sm">
            <span className="text-gray-400">24h Vol: </span>
            <span className="text-white font-mono">
              {formatVolume(totalVolume24h)}
            </span>
            {totalVolume24h > 0 && (
              <span className="text-xs text-green-400 ml-1">Real</span>
            )}
          </div>
          
          <div className="text-sm">
            <span className="text-gray-400">DEX: </span>
            <span className="text-crypto-primary font-mono">{activeDEXPairs}</span>
            <span className="text-xs text-gray-500 ml-1">
              {activeDEXPairs > 0 ? 'Active' : 'Loading'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Indicator */}
        <NetworkIndicator />

        {/* Real Data Connection Status */}
        <div className="flex items-center space-x-2">
          {isFullyConnected && !dexLoading ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs hidden sm:block ${isFullyConnected && !dexLoading ? 'text-green-400' : 'text-red-400'}`}>
            {isFullyConnected && !dexLoading ? 'Live Data' : 'Connecting'}
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
