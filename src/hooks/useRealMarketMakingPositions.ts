
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { useToast } from '@/hooks/use-toast';
import { MarketMakingPositionsService } from '@/services/marketMakingPositionsService';
import type { RealMarketMakingPosition, PositionCreationParams } from '@/types/marketMakingTypes';

export const useRealMarketMakingPositions = () => {
  const [positions, setPositions] = useState<RealMarketMakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, address } = useWallet();
  const { toast } = useToast();

  const fetchPositions = async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    try {
      const fetchedPositions = await MarketMakingPositionsService.fetchPositions(address);
      setPositions(fetchedPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch market making positions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLiquidity = async (
    pair: string,
    dex: string,
    tokenAAmount: number,
    tokenBAmount: number,
    priceA: number,
    priceB: number
  ) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to add liquidity",
        variant: "destructive"
      });
      return;
    }

    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Token amounts must be greater than zero",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const params: PositionCreationParams = {
        pair,
        dex,
        tokenAAmount,
        tokenBAmount,
        priceA,
        priceB
      };

      const result = await MarketMakingPositionsService.createPosition(params, address);
      
      if (result.success && result.position) {
        setPositions(prev => [result.position!, ...prev]);
        
        toast({
          title: "Success",
          description: `Added liquidity to ${pair} on ${dex}`,
        });
      } else {
        throw new Error(result.error || 'Failed to create position');
      }
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add liquidity",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeLiquidity = async (positionId: string) => {
    if (!address) return;

    setIsLoading(true);
    try {
      const result = await MarketMakingPositionsService.removePosition(positionId, address);
      
      if (result.success) {
        setPositions(prev => prev.filter(p => p.id !== positionId));
        
        toast({
          title: "Success",
          description: "Liquidity removed successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to remove position');
      }
    } catch (error) {
      console.error('Error removing liquidity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove liquidity",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePosition = async (positionId: string) => {
    if (!address) return;

    try {
      const result = await MarketMakingPositionsService.togglePositionStatus(positionId, address);
      
      if (result.success && result.newStatus) {
        setPositions(prev => 
          prev.map(p => 
            p.id === positionId 
              ? { ...p, status: result.newStatus! }
              : p
          )
        );
        
        toast({
          title: "Success",
          description: `Position ${result.newStatus === 'active' ? 'activated' : 'paused'}`,
        });
      } else {
        throw new Error(result.error || 'Failed to toggle position');
      }
    } catch (error) {
      console.error('Error toggling position:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update position",
        variant: "destructive"
      });
    }
  };

  const updatePositionMetrics = async (
    positionId: string,
    currentPriceA: number,
    currentPriceB: number,
    newVolume?: number,
    newFeesEarned?: number
  ) => {
    if (!address) return;

    try {
      const result = await MarketMakingPositionsService.updatePositionMetrics(
        positionId,
        address,
        currentPriceA,
        currentPriceB,
        newVolume,
        newFeesEarned
      );
      
      if (result.success) {
        await fetchPositions(); // Refresh positions to get updated metrics
      } else {
        console.error('Failed to update position metrics:', result.error);
      }
    } catch (error) {
      console.error('Error updating position metrics:', error);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchPositions();
    } else {
      setPositions([]);
    }
  }, [isConnected, address]);

  return {
    positions,
    isLoading,
    addLiquidity,
    removeLiquidity,
    togglePosition,
    updatePositionMetrics,
    refetchPositions: fetchPositions
  };
};

// Re-export types for convenience
export type { RealMarketMakingPosition, PositionCreationParams };
