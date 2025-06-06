
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradingPreferences as TradingPreferencesType } from "@/types/settings";

interface TradingPreferencesProps {
  tradingPrefs: TradingPreferencesType;
  setTradingPrefs: React.Dispatch<React.SetStateAction<TradingPreferencesType>>;
  onSave: () => void;
  isLoading: boolean;
}

export const TradingPreferences = ({ tradingPrefs, setTradingPrefs, onSave, isLoading }: TradingPreferencesProps) => {
  return (
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
          onClick={onSave}
          disabled={isLoading}
          className="bg-crypto-primary hover:bg-crypto-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Trading Preferences'}
        </Button>
      </div>
    </div>
  );
};
