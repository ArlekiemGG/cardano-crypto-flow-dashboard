
import { MarketData } from "@/types/trading";

interface MarketDataSectionProps {
  marketData: MarketData[];
}

export const MarketDataSection = ({ marketData }: MarketDataSectionProps) => {
  // Filter and deduplicate market data
  const uniqueMarketData = marketData.reduce((acc, data) => {
    const existing = acc.find(item => item.symbol === data.symbol);
    if (!existing || new Date(data.lastUpdate) > new Date(existing.lastUpdate)) {
      return [...acc.filter(item => item.symbol !== data.symbol), data];
    }
    return acc;
  }, [] as MarketData[]);

  // Ensure we have valid data to display
  const validData = uniqueMarketData.filter(data => 
    data.price > 0 && 
    data.price < 100 && // Reasonable price range for ADA
    data.symbol
  );

  return (
    <div className="glass rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Datos de Mercado en Tiempo Real (Blockfrost + DeFiLlama)
      </h2>
      
      {validData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {validData.slice(0, 6).map((data, index) => (
            <div key={`${data.symbol}-${index}`} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">{data.symbol}/USD</span>
                <span className={`text-sm ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                </span>
              </div>
              
              <div className="text-crypto-primary font-mono text-lg mb-1">
                ${data.price.toFixed(4)}
              </div>
              
              <div className="text-xs text-gray-400 space-y-1">
                <div>Vol: ${data.volume24h > 1000000 ? (data.volume24h / 1000000).toFixed(1) + 'M' : (data.volume24h / 1000).toFixed(0) + 'K'}</div>
                {data.marketCap > 0 && (
                  <div>Cap: ${(data.marketCap / 1000000000).toFixed(1)}B</div>
                )}
                <div className="text-xs text-gray-500">
                  {new Date(data.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Cargando datos de mercado...</div>
          <div className="text-xs text-gray-500">
            Conectando con Blockfrost y DeFiLlama
          </div>
        </div>
      )}
    </div>
  );
};
