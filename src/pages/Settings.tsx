
import { Settings as SettingsIcon, User, Shield, Bell, Wallet, Save, LogOut, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/ModernWalletContext"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface NotificationSettings {
  tradeAlerts: boolean;
  arbitrageOpportunities: boolean;
  portfolioUpdates: boolean;
  systemMaintenance: boolean;
}

interface TradingPreferences {
  defaultSlippage: number;
  maxGasFee: number;
  autoExecuteThreshold: number;
}

interface UserProfile {
  email: string;
  username: string;
}

interface SettingsData {
  profile?: UserProfile;
  notifications?: NotificationSettings;
  tradingPreferences?: TradingPreferences;
  walletName?: string;
  network?: string;
  lastUpdated?: string;
}

export default function Settings() {
  const { 
    isConnected, 
    address, 
    balance, 
    walletName, 
    network,
    disconnectWallet 
  } = useWallet();
  
  const { toast } = useToast();
  
  // State management
  const [userProfile, setUserProfile] = useState<UserProfile>({ email: '', username: '' });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    tradeAlerts: true,
    arbitrageOpportunities: true,
    portfolioUpdates: false,
    systemMaintenance: true,
  });
  const [tradingPrefs, setTradingPrefs] = useState<TradingPreferences>({
    defaultSlippage: 0.5,
    maxGasFee: 2.0,
    autoExecuteThreshold: 1,
  });
  const [twoFactorEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load user settings on component mount
  useEffect(() => {
    if (isConnected && address) {
      loadUserSettings();
    }
  }, [isConnected, address]);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('settings_json')
        .eq('wallet_address', address)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data?.settings_json) {
        // Type assertion to handle the Json type from Supabase
        const settings = data.settings_json as SettingsData;
        
        if (settings.profile) {
          setUserProfile(settings.profile);
        }
        if (settings.notifications) {
          setNotifications(settings.notifications);
        }
        if (settings.tradingPreferences) {
          setTradingPrefs(settings.tradingPreferences);
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveUserSettings = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const settingsData: SettingsData = {
        profile: userProfile,
        notifications,
        tradingPreferences: tradingPrefs,
        walletName,
        network,
        lastUpdated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .upsert({
          wallet_address: address,
          settings_json: settingsData as any, // Type assertion for Json compatibility
          last_login: new Date().toISOString(),
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "You have been logged out successfully",
    });
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

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
        {/* Account Settings */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-6 w-6 text-crypto-primary" />
            <h2 className="text-xl font-semibold text-white">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <input 
                type="email" 
                value={userProfile.email}
                onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary focus:outline-none" 
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Username</label>
              <input 
                type="text" 
                value={userProfile.username}
                onChange={(e) => setUserProfile(prev => ({ ...prev, username: e.target.value }))}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary focus:outline-none" 
                placeholder="Your username"
              />
            </div>
            <Button 
              onClick={saveUserSettings}
              disabled={isLoading}
              className="w-full bg-crypto-primary hover:bg-crypto-secondary"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-6 w-6 text-crypto-primary" />
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Two-Factor Authentication</span>
              <Button size="sm" variant="outline" className={`border-green-500/30 text-green-400 ${twoFactorEnabled ? 'bg-green-500/10' : ''}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">API Access</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-white/20 text-white">
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/90 border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">API Configuration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">API Key</label>
                      <div className="flex mt-1">
                        <input 
                          type={showApiKey ? "text" : "password"}
                          value="ck_test_abcd1234..."
                          readOnly
                          className="flex-1 bg-white/5 border border-white/10 rounded-l-lg px-3 py-2 text-white"
                        />
                        <Button 
                          onClick={() => setShowApiKey(!showApiKey)}
                          variant="outline" 
                          className="border-white/10 rounded-l-none"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">Use this API key to integrate with external trading bots</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Button className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30" variant="outline">
              Change Password
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-6 w-6 text-crypto-primary" />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggleNotification(key as keyof NotificationSettings)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Wallet className="h-6 w-6 text-crypto-primary" />
            <h2 className="text-xl font-semibold text-white">Wallet</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Connected Wallet</span>
              <span className="text-green-400 text-sm font-mono">{formatAddress(address || '')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Wallet Type</span>
              <span className="text-crypto-primary text-sm">{walletName || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Network</span>
              <span className="text-crypto-primary text-sm">{network}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Balance</span>
              <span className="text-white text-sm">{balance.toFixed(2)} ADA</span>
            </div>
            <Button 
              onClick={handleDisconnectWallet}
              className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </div>

      {/* Trading Preferences */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="h-6 w-6 text-crypto-primary" />
          <h2 className="text-xl font-semibold text-white">Trading Preferences</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-400 text-sm">Default Slippage %</label>
            <input 
              type="number" 
              value={tradingPrefs.defaultSlippage}
              onChange={(e) => setTradingPrefs(prev => ({ ...prev, defaultSlippage: parseFloat(e.target.value) || 0 }))}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary focus:outline-none" 
              placeholder="0.5"
              step="0.1"
              min="0"
              max="10"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Max Gas Fee (ADA)</label>
            <input 
              type="number" 
              value={tradingPrefs.maxGasFee}
              onChange={(e) => setTradingPrefs(prev => ({ ...prev, maxGasFee: parseFloat(e.target.value) || 0 }))}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary focus:outline-none" 
              placeholder="2.0"
              step="0.1"
              min="0"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Auto-Execute Threshold (%)</label>
            <select 
              value={tradingPrefs.autoExecuteThreshold}
              onChange={(e) => setTradingPrefs(prev => ({ ...prev, autoExecuteThreshold: parseInt(e.target.value) }))}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary focus:outline-none"
            >
              <option value="1">1% Profit</option>
              <option value="2">2% Profit</option>
              <option value="5">5% Profit</option>
              <option value="10">10% Profit</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            onClick={saveUserSettings}
            disabled={isLoading}
            className="bg-crypto-primary hover:bg-crypto-secondary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Trading Preferences'}
          </Button>
        </div>
      </div>
    </div>
  )
}
