
interface TradingSettingsPanelProps {
  minProfitThreshold: number;
  onMinProfitChange: (value: number) => void;
}

export const TradingSettingsPanel = ({ 
  minProfitThreshold, 
  onMinProfitChange 
}: TradingSettingsPanelProps) => {
  return (
    <div className="flex items-center space-x-2 ml-auto">
      <label className="text-sm text-gray-400">Min Profit %:</label>
      <input
        type="number"
        value={minProfitThreshold}
        onChange={(e) => onMinProfitChange(parseFloat(e.target.value))}
        className="w-20 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
        step="0.1"
        min="0"
      />
    </div>
  );
};
