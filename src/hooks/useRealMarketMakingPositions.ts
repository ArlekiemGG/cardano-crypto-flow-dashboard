
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RealMarketMakingPosition {
  id: string;
  user_wallet: string;
  pair: string;
  dex: string;
  liquidity_provided: number;
  token_a_amount: number;
  token_b_amount: number;
  current_spread: number;
  volume_24h: number;
  fees_earned: number;
  impermanent_loss: number;
  apy: number;
  status: 'active' | 'paused' | 'closed';
  pool_address?: string;
  lp_token_amount?: number;
  entry_price_a: number;
  entry_price_b: number;
  last_rebalance?: string;
  created_at: string;
  updated_at: string;
}

export const useRealMarketMakingPositions = () => {
  const [positions, setPositions] = useState<RealMarketMakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, walletAddress } = useWallet();
  const { toast } = useToast();

  // Fetch positions from database
  const fetchPositions = async () => {
    if (!isConnected || !walletAddress) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_making_positions')
        .select('*')
        .eq('user_wallet', walletAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching positions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch market making positions",
          variant: "destructive"
        });
        return;
      }

      setPositions(data || []);
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

  // Add new liquidity position
  const addLiquidity = async (
    pair: string,
    dex: string,
    tokenAAmount: number,
    tokenBAmount: number,
    priceA: number,
    priceB: number
  ) => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to add liquidity",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const liquidityProvided = tokenAAmount + (tokenBAmount * priceB / priceA);
      
      const { data, error } = await supabase
        .from('market_making_positions')
        .insert({
          user_wallet: walletAddress,
          pair,
          dex,
          liquidity_provided: liquidityProvided,
          token_a_amount: tokenAAmount,
          token_b_amount: tokenBAmount,
          entry_price_a: priceA,
          entry_price_b: priceB,
          current_spread: Math.random() * 0.5 + 0.1, // Simulated for now
          volume_24h: 0,
          fees_earned: 0,
          impermanent_loss: 0,
          apy: 0,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding liquidity:', error);
        toast({
          title: "Error",
          description: "Failed to add liquidity position",
          variant: "destructive"
        });
        return;
      }

      // Record the transaction
      await supabase
        .from('market_making_transactions')
        .insert({
          position_id: data.id,
          user_wallet: walletAddress,
          transaction_type: 'add_liquidity',
          amount_a: tokenAAmount,
          amount_b: tokenBAmount,
          price_a: priceA,
          price_b: priceB,
          status: 'confirmed'
        });

      setPositions(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: `Added liquidity to ${pair} on ${dex}`,
      });
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast({
        title: "Error",
        description: "Failed to add liquidity",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove liquidity position
  const removeLiquidity = async (positionId: string) => {
    if (!isConnected || !walletAddress) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('market_making_positions')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', positionId)
        .eq('user_wallet', walletAddress);

      if (error) {
        console.error('Error removing liquidity:', error);
        toast({
          title: "Error",
          description: "Failed to remove liquidity",
          variant: "destructive"
        });
        return;
      }

      // Record the transaction
      await supabase
        .from('market_making_transactions')
        .insert({
          position_id: positionId,
          user_wallet: walletAddress,
          transaction_type: 'remove_liquidity',
          status: 'confirmed'
        });

      setPositions(prev => 
        prev.map(p => 
          p.id === positionId 
            ? { ...p, status: 'closed' as const }
            : p
        )
      );
      
      toast({
        title: "Success",
        description: "Liquidity removed successfully",
      });
    } catch (error) {
      console.error('Error removing liquidity:', error);
      toast({
        title: "Error",
        description: "Failed to remove liquidity",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle position status
  const togglePosition = async (positionId: string) => {
    if (!isConnected || !walletAddress) return;

    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    const newStatus = position.status === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('market_making_positions')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', positionId)
        .eq('user_wallet', walletAddress);

      if (error) {
        console.error('Error toggling position:', error);
        toast({
          title: "Error",
          description: "Failed to update position status",
          variant: "destructive"
        });
        return;
      }

      setPositions(prev => 
        prev.map(p => 
          p.id === positionId 
            ? { ...p, status: newStatus }
            : p
        )
      );
      
      toast({
        title: "Success",
        description: "Position status updated",
      });
    } catch (error) {
      console.error('Error toggling position:', error);
      toast({
        title: "Error",
        description: "Failed to update position",
        variant: "destructive"
      });
    }
  };

  // Load positions when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchPositions();
    } else {
      setPositions([]);
    }
  }, [isConnected, walletAddress]);

  return {
    positions: positions.filter(p => p.status !== 'closed'),
    isLoading,
    addLiquidity,
    removeLiquidity,
    togglePosition,
    refetchPositions: fetchPositions
  };
};
