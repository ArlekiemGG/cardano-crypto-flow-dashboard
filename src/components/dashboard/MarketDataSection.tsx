
import { MarketData } from "@/types/trading";
import { useOptimizedMarketData } from "@/hooks/useOptimizedMarketData";

interface MarketDataSectionProps {
  marketData: MarketData[];
}

export const MarketDataSection = ({ marketData }: MarketDataSectionProps) => {
  // Use optimized market data for real-time information
  const { 
    getADAPrice, 
    getADAChange24h, 
    getADAVolume24h,
    getTopProtocolsByTVL,
    isRealDataAvailable,
    dataSource 
  } = useOptimizedMarketData();

  // Get real ADA data directly from APIs
  const realADAPrice = getADAPrice();
  const realADAChange = getADAChange24h();
  const realADAVolume = getADAVolume24h();
  const topProtocols = getTopProtocolsByTVL(5);

  // Create real market data array from API sources
  const realMarketData = [];
  
  // Add real ADA data if available
  if (realADAPrice > 0) {
    realMarketData.push({
      symbol: 'ADA',
      price: realADAPrice,
      change24h: realADAChange,
      volume24h: realADAVolume,
      marketCap: realADAVolume * 100, // Approximate market cap
      lastUpdate: new Date().toISOString(),
      source: dataSource === 'defillama' ? 'DeFiLlama' : 'Mixed APIs'
    });
  }

  // Add top protocol data as additional market insights
  topProtocols.forEach((protocol, index) => {
    if (protocol.tvl > 1000000) { // Only show significant protocols
      realMarketData.push({
        symbol: protocol.name.substring(0, 6).toUpperCase(),
        price: protocol.tvl / 1000000, // TVL in millions as "price"
        change24h: protocol.change_1d || 0,
        volume24h: protocol.tvl * 0.1, // Estimate volume as 10% of TVL
        marketCap: protocol.tvl,
        lastUpdate: new Date().toISOString(),
        source: 'DeFiLlama TVL'
      });
    }
  });

  // Use real data if available, fallback to provided market data
  const displayData = realMarketData.length > 0 ? realMarketData : marketData;
  const hasRealData = isRealDataAvailable();

  return (
    <div className="glass rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Datos de Mercado en Tiempo Real 
        <span className={`text-sm ml-2 ${hasRealData ? 'text-green-400' : 'text-yellow-400'}`}>
          ({hasRealData ? 'APIs Externas' : 'Cache/Fallback'})
        </span>
      </h2>
      
      {displayData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayData.slice(0, 6).map((data, index) => (
            <div key={`${data.symbol}-${index}`} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">{data.symbol}/USD</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                  </span>
                  {data.source && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1 rounded">
                      {data.source}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-crypto-primary font-mono text-lg mb-1">
                ${data.price.toFixed(data.symbol === 'ADA' ? 4 : 2)}
              </div>
              
              <div className="text-xs text-gray-400 space-y-1">
                <div>Vol: ${data.volume24h > 1000000 ? (data.volume24h / 1000000).toFixed(1) + 'M' : (data.volume24h / 1000).toFixed(0) + 'K'}</div>
                {data.marketCap > 0 && (
                  <div>
                    {data.symbol === 'ADA' ? 'Cap' : 'TVL'}: ${(data.marketCap / 1000000000).toFixed(1)}B
                  </div>
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
          <div className="text-gray-400 mb-2">Conectando a APIs externas...</div>
          <div className="text-xs text-gray-500">
            Obteniendo datos de DeFiLlama y CoinGecko
          </div>
        </div>
      )}
    </div>
  );
};
