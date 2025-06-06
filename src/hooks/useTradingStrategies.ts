
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TradingStrategy {
  id: string;
  name: string;
  strategy_type: 'DCA' | 'Grid' | 'MeanReversion' | 'Momentum' | 'Arbitrage';
  active: boolean;
  profit_loss: number;
  total_trades: number;
  created_at: string;
  config_json: Record<string, any>;
}

export const useTradingStrategies = (userWallet?: string) => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchStrategies = async () => {
    if (!userWallet) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_trading_strategies', {
        p_user_wallet: userWallet
      });

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast({
        title: "Error",
        description: "Failed to load trading strategies",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createStrategy = async (
    name: string, 
    strategyType: 'DCA' | 'Grid' | 'MeanReversion' | 'Momentum' | 'Arbitrage',
    config: Record<string, any> = {}
  ) => {
    if (!userWallet) return null;

    try {
      const { data, error } = await supabase.rpc('create_trading_strategy', {
        p_user_wallet: userWallet,
        p_name: name,
        p_strategy_type: strategyType,
        p_config_json: config
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Strategy "${name}" created successfully`
      });
      
      fetchStrategies();
      return data;
    } catch (error) {
      console.error('Error creating strategy:', error);
      toast({
        title: "Error",
        description: "Failed to create strategy",
        variant: "destructive"
      });
      return null;
    }
  };

  const toggleStrategy = async (strategyId: string) => {
    if (!userWallet) return;

    try {
      const { data, error } = await supabase.rpc('toggle_strategy_status', {
        p_strategy_id: strategyId,
        p_user_wallet: userWallet
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Strategy ${data ? 'activated' : 'paused'}`
      });
      
      fetchStrategies();
    } catch (error) {
      console.error('Error toggling strategy:', error);
      toast({
        title: "Error",
        description: "Failed to update strategy status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, [userWallet]);

  return {
    strategies,
    isLoading,
    createStrategy,
    toggleStrategy,
    refreshStrategies: fetchStrategies
  };
};
