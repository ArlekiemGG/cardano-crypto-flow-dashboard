
import { Wallet } from "lucide-react"
import { useWallet } from "@/contexts/ModernWalletContext"
import { useSettingsData } from "@/hooks/useSettingsData"
import { AccountSettings } from "@/components/settings/AccountSettings"
import { SecuritySettings } from "@/components/settings/SecuritySettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { WalletSettings } from "@/components/settings/WalletSettings"
import { TradingPreferences } from "@/components/settings/TradingPreferences"

export default function Settings() {
  const { isConnected } = useWallet();
  
  const {
    userProfile,
    setUserProfile,
    notifications,
    toggleNotification,
    tradingPrefs,
    setTradingPrefs,
    isLoading,
    saveUserSettings,
  } = useSettingsData();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Wallet className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Wallet Required</h2>
          <p className="text-gray-400">Please connect your wallet to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Configure your trading preferences and account settings</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountSettings 
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          onSave={saveUserSettings}
          isLoading={isLoading}
        />

        <SecuritySettings />

        <NotificationSettings 
          notifications={notifications}
          onToggle={toggleNotification}
        />

        <WalletSettings />
      </div>

      {/* Trading Preferences */}
      <TradingPreferences 
        tradingPrefs={tradingPrefs}
        setTradingPrefs={setTradingPrefs}
        onSave={saveUserSettings}
        isLoading={isLoading}
      />
    </div>
  )
}
