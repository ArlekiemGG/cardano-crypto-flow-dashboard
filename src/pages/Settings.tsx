
import { Settings as SettingsIcon, User, Shield, Bell, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Settings() {
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
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" 
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Username</label>
              <input 
                type="text" 
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" 
                placeholder="Your username"
              />
            </div>
            <Button className="w-full bg-crypto-primary hover:bg-crypto-secondary">
              Save Changes
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
              <Button size="sm" variant="outline" className="border-green-500/30 text-green-400">
                Enabled
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">API Access</span>
              <Button size="sm" variant="outline" className="border-white/20 text-white">
                Configure
              </Button>
            </div>
            <Button className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30">
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
            {[
              { name: "Trade Alerts", enabled: true },
              { name: "Arbitrage Opportunities", enabled: true },
              { name: "Portfolio Updates", enabled: false },
              { name: "System Maintenance", enabled: true },
            ].map((notification, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-white">{notification.name}</span>
                <div className={`w-12 h-6 rounded-full ${notification.enabled ? 'bg-crypto-primary' : 'bg-gray-600'} relative cursor-pointer transition-colors`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notification.enabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </div>
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
              <span className="text-green-400 text-sm">addr1q...xyz</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Network</span>
              <span className="text-crypto-primary text-sm">Mainnet</span>
            </div>
            <Button className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30">
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
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" 
              placeholder="0.5"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Max Gas Fee (ADA)</label>
            <input 
              type="number" 
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" 
              placeholder="2.0"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Auto-Execute Threshold</label>
            <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
              <option value="1">1% Profit</option>
              <option value="2">2% Profit</option>
              <option value="5">5% Profit</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
