
import { MarketData } from "@/types/trading";

interface MarketDataSectionProps {
  marketData: MarketData[];
}

export const MarketDataSection = ({ marketData }: MarketDataSectionProps) => {
  return (
    <div className="glass rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Simplified Market Data (Blockfrost + DeFiLlama)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketData.slice(0, 6).map((data, index) => (
          <div key={`${data.symbol}-${index}`} className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">{data.symbol}</span>
              <span className={`text-sm ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
              </span>
            </div>
            <div className="text-crypto-primary font-mono text-lg">
              ${data.price.toFixed(4)}
            </div>
            <div className="text-xs text-gray-400">
              Vol: ${(data.volume24h / 1000).toFixed(0)}K
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
