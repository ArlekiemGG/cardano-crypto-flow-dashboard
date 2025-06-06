
import { useMemo } from 'react';
import { MarketData } from '@/types/trading';

export const usePortfolioCalculations = (marketData: MarketData[], balance: number) => {
  return useMemo(() => {
    const adaData = marketData.find(data => data.symbol === 'ADA');
    const adaPrice = adaData?.price || 0.63;
    const realPortfolioValue = balance * adaPrice;
    const dailyChange = adaData?.change24h || 0;
    const dailyPnL = realPortfolioValue * (dailyChange / 100);
    
    return {
      portfolioValue: realPortfolioValue,
      dailyPnL,
      adaPrice
    };
  }, [marketData, balance]);
};
