
import { useState, useEffect, useCallback } from 'react';
import { useOptimizedMarketData } from './useOptimizedMarketData';

interface SpreadAnalysis {
  currentSpread: number;
  spreadPercentage: number;
  optimalBidPrice: number;
  optimalAskPrice: number;
  profitability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  volatility24h: number;
}

interface MarketConditions {
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  volatility: number;
  volume: number;
  support: number;
  resistance: number;
}

export const useSpreadOptimization = (pair: string = "ADA/USDC") => {
  const [spreadAnalysis, setSpreadAnalysis] = useState<SpreadAnalysis | null>(null);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { getADAPrice, getADAChange24h, getADAVolume24h, hasRealPriceData } = useOptimizedMarketData();

  const calculateOptimalSpread = useCallback((): SpreadAnalysis | null => {
    const currentPrice = getADAPrice();
    const change24h = getADAChange24h();
    const volume24h = getADAVolume24h();
    
    if (!currentPrice || !hasRealPriceData()) {
      return null;
    }

    // Calculate volatility based on 24h change
    const volatility24h = Math.abs(change24h);
    
    // Base spread calculation (0.1% - 1% based on volatility)
    const baseSpread = Math.max(0.001, Math.min(0.01, volatility24h / 100));
    const spreadAmount = currentPrice * baseSpread;
    
    // Calculate optimal bid/ask prices
    const optimalBidPrice = currentPrice - (spreadAmount / 2);
    const optimalAskPrice = currentPrice + (spreadAmount / 2);
    
    // Calculate profitability score (0-100)
    const volumeScore = Math.min(100, (volume24h / 1000000) * 10); // Volume in millions
    const spreadScore = Math.min(100, (baseSpread * 10000)); // Spread in basis points
    const profitability = (volumeScore + spreadScore) / 2;
    
    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (volatility24h < 2) riskLevel = 'LOW';
    else if (volatility24h < 5) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';
    
    // Generate recommendation
    let recommendation = '';
    if (riskLevel === 'LOW' && profitability > 60) {
      recommendation = 'Excellent conditions for market making. Low risk, good profit potential.';
    } else if (riskLevel === 'MEDIUM') {
      recommendation = 'Moderate conditions. Consider tighter spreads but monitor closely.';
    } else {
      recommendation = 'High volatility detected. Use wider spreads and smaller position sizes.';
    }
    
    return {
      currentSpread: spreadAmount,
      spreadPercentage: baseSpread * 100,
      optimalBidPrice,
      optimalAskPrice,
      profitability,
      riskLevel,
      recommendation,
      volatility24h
    };
  }, [getADAPrice, getADAChange24h, getADAVolume24h, hasRealPriceData]);

  const analyzeMarketConditions = useCallback((): MarketConditions | null => {
    const currentPrice = getADAPrice();
    const change24h = getADAChange24h();
    const volume24h = getADAVolume24h();
    
    if (!currentPrice) return null;

    // Determine trend based on 24h change
    let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    if (change24h > 2) trend = 'BULLISH';
    else if (change24h < -2) trend = 'BEARISH';
    else trend = 'SIDEWAYS';
    
    // Calculate support and resistance levels (simplified)
    const support = currentPrice * 0.95; // 5% below current
    const resistance = currentPrice * 1.05; // 5% above current
    
    return {
      trend,
      volatility: Math.abs(change24h),
      volume: volume24h,
      support,
      resistance
    };
  }, [getADAPrice, getADAChange24h, getADAVolume24h]);

  const performAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate analysis delay for realism
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const spreadData = calculateOptimalSpread();
      const marketData = analyzeMarketConditions();
      
      setSpreadAnalysis(spreadData);
      setMarketConditions(marketData);
      
    } catch (error) {
      console.error('Error performing spread analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [calculateOptimalSpread, analyzeMarketConditions]);

  // Auto-analyze when data changes
  useEffect(() => {
    if (hasRealPriceData()) {
      performAnalysis();
    }
  }, [hasRealPriceData, performAnalysis]);

  return {
    spreadAnalysis,
    marketConditions,
    isAnalyzing,
    performAnalysis,
    hasValidData: hasRealPriceData()
  };
};
