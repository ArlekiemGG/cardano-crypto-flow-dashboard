
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WalletContextService } from '@/services/walletContextService';

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
  const { isConnected, address } = useWallet();
  const { toast } = useToast();

  const fetchStrategies = async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    try {
      const { data, error } = await WalletContextService.executeWithWalletContext(
        address,
        async () => {
          return await supabase
            .from('market_making_strategies')
            .select('*')
            .order('created_at', { ascending: false });
        }
      );

      if (error) {
        console.error('Error fetching strategies:', error);
        return;
      }

      // Cast the data to proper types
      const typedStrategies = (data || []).map(strategy => ({
        ...strategy,
        strategy_type: strategy.strategy_type as 'fixed_spread' | 'dynamic_spread' | 'grid_trading'
      })) as MarketMakingStrategy[];

      setStrategies(typedStrategies);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createStrategy = async (strategy: Omit<MarketMakingStrategy, 'id' | 'user_wallet' | 'created_at' | 'updated_at'>) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create a strategy",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await WalletContextService.executeWithWalletContext(
        address,
        async () => {
          return await supabase
            .from('market_making_strategies')
            .insert({
              ...strategy,
              user_wallet: address
            })
            .select()
            .single();
        }
      );

      if (error) {
        console.error('Error creating strategy:', error);
        toast({
          title: "Error",
          description: "Failed to create strategy",
          variant: "destructive"
        });
        return;
      }

      // Cast the returned data to proper type
      const typedStrategy = {
        ...data,
        strategy_type: data.strategy_type as 'fixed_spread' | 'dynamic_spread' | 'grid_trading'
      } as MarketMakingStrategy;

      setStrategies(prev => [typedStrategy, ...prev]);
      
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
      const { error } = await WalletContextService.executeWithWalletContext(
        address!,
        async () => {
          return await supabase
            .from('market_making_strategies')
            .update({ 
              active: !strategy.active,
              updated_at: new Date().toISOString()
            })
            .eq('id', strategyId);
        }
      );

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
    if (isConnected && address) {
      fetchStrategies();
    } else {
      setStrategies([]);
    }
  }, [isConnected, address]);

  return {
    strategies,
    isLoading,
    createStrategy,
    toggleStrategy,
    refetchStrategies: fetchStrategies
  };
};
