
import { Bell, Wifi, WifiOff } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { RealTimePrice } from "@/components/RealTimePrice"
import { useConnectionHealth } from "@/hooks/useConnectionHealth"
import { useWallet } from "@/contexts/ModernWalletContext"
import { ModernWalletConnector } from "./ModernWalletConnector"
import { ModernWalletInfo } from "./ModernWalletInfo"
import { NetworkIndicator } from "./NetworkIndicator"
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData'
import { NotificationsDropdown } from "./NotificationsDropdown"
import { useState } from "react"

export function Header() {
  const { connectedSources } = useConnectionHealth()
  const { isConnected: walletConnected } = useWallet()
  
  // Sample notifications data with read state
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Nueva oportunidad de arbitraje detectada",
      description: "Se ha detectado una nueva oportunidad de arbitraje con potencial beneficio.",
      time: "Hace 5 minutos"
    },
    {
      id: "2",
      title: "Precio de ADA actualizado",
      description: "El precio de ADA se ha actualizado a $0.6413",
      time: "Hace 10 minutos"
    },
    {
      id: "3",
      title: "Conexión a DeFiLlama estable",
      description: "La conexión con DeFiLlama se ha restablecido correctamente.",
      time: "Hace 15 minutos"
    }
  ]);

  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  
  // Use the optimized market data hook for DeFiLlama data
  const { 
    dexVolumes,
    isLoading,
    dataSource,
    getTotalDexVolume24h
  } = useOptimizedMarketData()
  
  // Get total DEX volume from DeFiLlama
  const totalVolume24h = getTotalDexVolume24h()
  
  // Count active DEX pairs from DeFiLlama data
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
      return `$${volume.toFixed(0)}`;
    }
  };

  const handleMarkNotificationsAsRead = () => {
    setHasUnreadNotifications(false);
  };

  // Show notifications only if there are unread ones
  const displayNotifications = hasUnreadNotifications ? notifications : [];

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
              {totalVolume24h > 0 
                ? formatVolume(totalVolume24h)
                : 'Loading...'
              }
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">DEX Pairs: </span>
            <span className="text-crypto-primary font-mono">{activeDEXPairs}</span>
            <span className="text-xs text-gray-500 ml-1">(Active)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Indicator */}
        <NetworkIndicator />

        {/* DeFiLlama Connection Status */}
        <div className="flex items-center space-x-2">
          {!isLoading ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs hidden sm:block ${!isLoading ? 'text-green-400' : 'text-red-400'}`}>
            {!isLoading ? 'DeFiLlama Live' : 'Disconnected'}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <NotificationsDropdown 
          notifications={displayNotifications} 
          onMarkAsRead={handleMarkNotificationsAsRead}
        />

        {/* Modern Wallet Connection */}
        {walletConnected ? <ModernWalletInfo /> : <ModernWalletConnector />}
      </div>
    </header>
  )
}
