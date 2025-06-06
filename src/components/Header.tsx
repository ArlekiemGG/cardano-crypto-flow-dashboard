
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

  // Get real 24h volume from actual CoinGecko data
  const adaData = marketData.find(data => data.symbol === 'ADA')
  const ada24hVolume = adaData?.volume24h || 0
  const adaMarketCap = adaData?.marketCap || 0

  return (
    <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="text-white hover:bg-white/10" />
        
        {/* Real-Time Stats */}
        <div className="hidden md:flex items-center space-x-6">
          <RealTimePrice />
          <div className="text-sm">
            <span className="text-gray-400">24h ADA Volume: </span>
            <span className="text-white font-mono">
              {ada24hVolume > 0 
                ? ada24hVolume > 1000000000 
                  ? `$${(ada24hVolume / 1000000000).toFixed(1)}B`
                  : `$${(ada24hVolume / 1000000).toFixed(1)}M`
                : 'Loading...'
              }
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Market Cap: </span>
            <span className="text-crypto-primary font-mono">
              {adaMarketCap > 0 
                ? `$${(adaMarketCap / 1000000000).toFixed(1)}B`
                : 'Loading...'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Indicator */}
        <NetworkIndicator />

        {/* CoinGecko Connection Status for ADA Data */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs hidden sm:block ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'CoinGecko Live' : 'Disconnected'}
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
