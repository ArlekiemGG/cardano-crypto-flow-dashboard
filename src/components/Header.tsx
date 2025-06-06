
import { Bell, Wifi, WifiOff } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { RealTimePrice } from "@/components/RealTimePrice"
import { useRealTimeData } from "@/hooks/useRealTimeData"
import { useWallet } from "@/contexts/ModernWalletContext"
import { ModernWalletConnector } from "./ModernWalletConnector"
import { ModernWalletInfo } from "./ModernWalletInfo"
import { NetworkIndicator } from "./NetworkIndicator"

export function Header() {
  const { isConnected, marketData } = useRealTimeData()
  const { isConnected: walletConnected } = useWallet()
  const notifications = 3

  // Calculate real 24h volume from actual market data
  const total24hVolume = marketData.reduce((sum, data) => sum + data.volume24h, 0)
  const activeBots = marketData.filter(data => data.symbol !== 'ADA').length

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
              ${total24hVolume > 1000000 
                ? `${(total24hVolume / 1000000).toFixed(1)}M` 
                : `${(total24hVolume / 1000).toFixed(0)}K`}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Active Pairs: </span>
            <span className="text-crypto-primary font-mono">{activeBots}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Indicator */}
        <NetworkIndicator />

        {/* DEX Connection Status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs hidden sm:block ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'DEX Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-white hover:bg-white/10">
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>

        {/* Modern Wallet Connection */}
        {walletConnected ? <ModernWalletInfo /> : <ModernWalletConnector />}
      </div>
    </header>
  )
}
