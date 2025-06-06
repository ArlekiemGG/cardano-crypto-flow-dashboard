
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketMakingStrategy {
  id: string;
  user_wallet: string;
  name: string;
  pair: string;
  dex: string;
  strategy_type: 'fixed_spread' | 'dynamic_spread' | 'grid_trading';
  min_spread: number;
  max_spread: number;
  rebalance_threshold: number;
  auto_compound: boolean;
  active: boolean;
  config_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useMarketMakingStrategies = () => {
  const [strategies, setStrategies] = useState<MarketMakingStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, walletAddress } = useWallet();
  const { toast } = useToast();

  const fetchStrategies = async () => {
    if (!isConnected || !walletAddress) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_making_strategies')
        .select('*')
        .eq('user_wallet', walletAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching strategies:', error);
        return;
      }

      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createStrategy = async (strategy: Omit<MarketMakingStrategy, 'id' | 'user_wallet' | 'created_at' | 'updated_at'>) => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create a strategy",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_making_strategies')
        .insert({
          ...strategy,
          user_wallet: walletAddress
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating strategy:', error);
        toast({
          title: "Error",
          description: "Failed to create strategy",
          variant: "destructive"
        });
        return;
      }

      setStrategies(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: `Strategy "${strategy.name}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating strategy:', error);
      toast({
        title: "Error",
        description: "Failed to create strategy",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStrategy = async (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    try {
      const { error } = await supabase
        .from('market_making_strategies')
        .update({ 
          active: !strategy.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategyId)
        .eq('user_wallet', walletAddress);

      if (error) {
        console.error('Error toggling strategy:', error);
        toast({
          title: "Error",
          description: "Failed to update strategy",
          variant: "destructive"
        });
        return;
      }

      setStrategies(prev => 
        prev.map(s => 
          s.id === strategyId 
            ? { ...s, active: !s.active }
            : s
        )
      );
      
      toast({
        title: "Success",
        description: `Strategy ${strategy.active ? 'paused' : 'activated'}`,
      });
    } catch (error) {
      console.error('Error toggling strategy:', error);
    }
  };

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchStrategies();
    } else {
      setStrategies([]);
    }
  }, [isConnected, walletAddress]);

  return {
    strategies,
    isLoading,
    createStrategy,
    toggleStrategy,
    refetchStrategies: fetchStrategies
  };
};
