
import { Bell, Wifi, WifiOff } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Header() {
  const [isConnected, setIsConnected] = useState(true)
  const [notifications, setNotifications] = useState(3)

  return (
    <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="text-white hover:bg-white/10" />
        
        {/* Live Stats */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="text-sm">
            <span className="text-gray-400">ADA/USD: </span>
            <span className="text-green-400 font-mono">$0.4523</span>
            <span className="text-green-400 text-xs ml-1">+2.4%</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">24h Vol: </span>
            <span className="text-white font-mono">$347.2M</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Active Bots: </span>
            <span className="text-crypto-primary font-mono">7</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs hidden sm:block ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
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

        {/* Wallet */}
        <Button 
          className="glass border border-crypto-primary/30 text-crypto-primary hover:bg-crypto-primary/10 text-sm"
          size="sm"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          Wallet Connected
        </Button>
      </div>
    </header>
  )
}
