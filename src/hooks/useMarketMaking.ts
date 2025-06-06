
import { useState, useEffect } from 'react';
import { useOptimizedMarketData } from './useOptimizedMarketData';
import { useWallet } from '@/contexts/ModernWalletContext';
import { useToast } from '@/hooks/use-toast';

export interface MarketMakingPosition {
  id: string;
  pair: string;
  dex: string;
  liquidityProvided: number;
  currentSpread: number;
  volume24h: number;
  feesEarned: number;
  impermanentLoss: number;
  apy: number;
  status: 'active' | 'paused';
}

export interface SpreadCalculation {
  pair: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  estimatedProfit: number;
}

export const useMarketMaking = () => {
  const [positions, setPositions] = useState<MarketMakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, address } = useWallet();
  const { prices, getADAPrice } = useOptimizedMarketData();
  const { toast } = useToast();

  // Simulated positions for demonstration
  useEffect(() => {
    if (isConnected && prices) {
      const mockPositions: MarketMakingPosition[] = [
        {
          id: '1',
          pair: 'ADA/USDC',
          dex: 'Minswap',
          liquidityProvided: 15420.50,
          currentSpread: 0.15,
          volume24h: 89234.67,
          feesEarned: 156.78,
          impermanentLoss: -23.45,
          apy: 12.5,
          status: 'active'
        },
        {
          id: '2', 
          pair: 'ADA/DJED',
          dex: 'SundaeSwap',
          liquidityProvided: 8650.25,
          currentSpread: 0.22,
          volume24h: 45678.90,
          feesEarned: 89.34,
          impermanentLoss: -12.67,
          apy: 8.7,
          status: 'active'
        },
        {
          id: '3',
          pair: 'MIN/ADA',
          dex: 'Minswap',
          liquidityProvided: 5230.80,
          currentSpread: 0.35,
          volume24h: 23456.78,
          feesEarned: 67.89,
          impermanentLoss: -8.90,
          apy: 15.2,
          status: 'paused'
        }
      ];
      setPositions(mockPositions);
    }
  }, [isConnected, prices]);

  const calculateSpread = (pair: string, amount: number): SpreadCalculation => {
    const adaPrice = getADAPrice();
    const basePrice = pair.includes('ADA') ? adaPrice : 1.0;
    
    // Simulate market depth and spread calculation
    const marketDepth = Math.random() * 0.5 + 0.1; // 0.1% to 0.6%
    const buyPrice = basePrice * (1 + marketDepth);
    const sellPrice = basePrice * (1 - marketDepth);
    const spread = buyPrice - sellPrice;
    const spreadPercentage = (spread / basePrice) * 100;
    const estimatedProfit = (amount * spreadPercentage) / 100;

    return {
      pair,
      buyPrice,
      sellPrice,
      spread,
      spreadPercentage,
      estimatedProfit
    };
  };

  const addLiquidity = async (pair: string, amount: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to add liquidity",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate liquidity addition
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPosition: MarketMakingPosition = {
        id: Date.now().toString(),
        pair,
        dex: 'Minswap',
        liquidityProvided: amount,
        currentSpread: Math.random() * 0.5 + 0.1,
        volume24h: 0,
        feesEarned: 0,
        impermanentLoss: 0,
        apy: 0,
        status: 'active'
      };

      setPositions(prev => [...prev, newPosition]);
      
      toast({
        title: "Success",
        description: `Added ${amount} ADA liquidity to ${pair}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add liquidity",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeLiquidity = async (positionId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPositions(prev => prev.filter(p => p.id !== positionId));
      
      toast({
        title: "Success",
        description: "Liquidity removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to remove liquidity",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePosition = async (positionId: string) => {
    setPositions(prev => 
      prev.map(p => 
        p.id === positionId 
          ? { ...p, status: p.status === 'active' ? 'paused' : 'active' }
          : p
      )
    );
    
    toast({
      title: "Success",
      description: "Position status updated",
    });
  };

  const getTotalStats = () => {
    const totalLiquidity = positions.reduce((sum, p) => sum + p.liquidityProvided, 0);
    const totalFeesEarned = positions.reduce((sum, p) => sum + p.feesEarned, 0);
    const totalVolume = positions.reduce((sum, p) => sum + p.volume24h, 0);
    const activePairs = positions.filter(p => p.status === 'active').length;
    const avgAPY = positions.length > 0 
      ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length 
      : 0;

    return {
      totalLiquidity,
      totalFeesEarned,
      totalVolume,
      activePairs,
      avgAPY
    };
  };

  return {
    positions,
    isLoading,
    calculateSpread,
    addLiquidity,
    removeLiquidity,
    togglePosition,
    getTotalStats,
    isConnected
  };
};
