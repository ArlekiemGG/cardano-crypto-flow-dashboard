
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { useOptimizedMarketData } from './useOptimizedMarketData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface RealMarketMakingPosition {
  id: string;
  pair: string;
  dex: string;
  tokenAAmount: number;
  tokenBAmount: number;
  priceA: number;
  priceB: number;
  totalValueADA: number;
  liquidityTokens: number;
  feesEarned24h: number;
  feesEarnedTotal: number;
  impermanentLoss: number;
  currentAPR: number;
  status: 'active' | 'paused' | 'withdrawn';
  createdAt: string;
  lastUpdate: string;
}

export const useRealMarketMakingPositions = () => {
  const [positions, setPositions] = useState<RealMarketMakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, address } = useWallet();
  const { getADAPrice, getTokenPrice } = useOptimizedMarketData();
  const { toast } = useToast();

  const fetchPositions = async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_making_positions')
        .select('*')
        .eq('user_wallet', address)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const realPositions: RealMarketMakingPosition[] = (data || []).map(pos => {
        const currentPriceA = pos.pair.includes('ADA') ? getADAPrice() : getTokenPrice(pos.token_a_id);
        const currentPriceB = pos.pair.includes('USDC') ? 1 : getTokenPrice(pos.token_b_id);
        
        const totalValueADA = (pos.token_a_amount * currentPriceA) + (pos.token_b_amount * currentPriceB);
        const initialValueADA = (pos.initial_token_a_amount * pos.initial_price_a) + (pos.initial_token_b_amount * pos.initial_price_b);
        const impermanentLoss = ((totalValueADA - initialValueADA) / initialValueADA) * 100;
        
        return {
          id: pos.id,
          pair: pos.pair,
          dex: pos.dex,
          tokenAAmount: pos.token_a_amount,
          tokenBAmount: pos.token_b_amount,
          priceA: currentPriceA,
          priceB: currentPriceB,
          totalValueADA,
          liquidityTokens: pos.liquidity_tokens,
          feesEarned24h: pos.fees_earned_24h,
          feesEarnedTotal: pos.fees_earned_total,
          impermanentLoss,
          currentAPR: pos.current_apr,
          status: pos.status,
          createdAt: pos.created_at,
          lastUpdate: pos.updated_at
        };
      });

      setPositions(realPositions);
    } catch (error) {
      console.error('Error fetching real positions:', error);
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
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('market_making_positions')
        .insert({
          user_wallet: address,
          pair,
          dex,
          token_a_amount: tokenAAmount,
          token_b_amount: tokenBAmount,
          initial_token_a_amount: tokenAAmount,
          initial_token_b_amount: tokenBAmount,
          initial_price_a: priceA,
          initial_price_b: priceB,
          liquidity_tokens: Math.sqrt(tokenAAmount * tokenBAmount),
          fees_earned_24h: 0,
          fees_earned_total: 0,
          current_apr: 0,
          status: 'active'
        });

      if (error) throw error;

      await fetchPositions();
      
      toast({
        title: "Success",
        description: `Added liquidity to ${pair} on ${dex}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast({
        title: "Error",
        description: "Failed to add liquidity position",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeLiquidity = async (positionId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('market_making_positions')
        .update({ status: 'withdrawn' })
        .eq('id', positionId);

      if (error) throw error;

      await fetchPositions();
      
      toast({
        title: "Success",
        description: "Liquidity position withdrawn",
      });
    } catch (error) {
      console.error('Error removing liquidity:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw liquidity",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePosition = async (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    const newStatus = position.status === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('market_making_positions')
        .update({ status: newStatus })
        .eq('id', positionId);

      if (error) throw error;

      setPositions(prev => 
        prev.map(p => 
          p.id === positionId 
            ? { ...p, status: newStatus }
            : p
        )
      );
      
      toast({
        title: "Success",
        description: `Position ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      console.error('Error toggling position:', error);
      toast({
        title: "Error",
        description: "Failed to update position status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchPositions();
      
      // Update positions every 2 minutes with real data
      const interval = setInterval(fetchPositions, 120000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  return {
    positions,
    isLoading,
    addLiquidity,
    removeLiquidity,
    togglePosition,
    refetchPositions: fetchPositions
  };
};
