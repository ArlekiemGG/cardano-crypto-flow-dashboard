
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
  config_json: any;
}

export const useTradingStrategies = (userWallet?: string) => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Function to ensure user exists in the users table
  const ensureUserExists = async (walletAddress: string) => {
    try {
      // Use the RPC function to handle user creation safely
      const { error } = await supabase.rpc('ensure_user_exists' as any, {
        p_wallet_address: walletAddress
      });

      if (error) {
        console.error('Error ensuring user exists:', error);
        throw new Error('Failed to ensure user exists');
      }
      
      console.log('User ensured to exist:', walletAddress);
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  };

  const fetchStrategies = async () => {
    if (!userWallet) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_trading_strategies', {
        p_user_wallet: userWallet
      });

      if (error) throw error;
      
      // Transform the data to ensure type compatibility
      const transformedData: TradingStrategy[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        strategy_type: item.strategy_type,
        active: item.active,
        profit_loss: item.profit_loss,
        total_trades: item.total_trades,
        created_at: item.created_at,
        config_json: item.config_json || {}
      }));

      setStrategies(transformedData);
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
      // Ensure user exists before creating strategy
      await ensureUserExists(userWallet);
      
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

  const updateStrategy = async (strategyId: string, updates: Record<string, any>) => {
    if (!userWallet) return;

    try {
      const { error } = await supabase
        .from('trading_strategies')
        .update(updates)
        .eq('id', strategyId)
        .eq('user_wallet', userWallet);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Strategy updated successfully"
      });
      
      fetchStrategies();
    } catch (error) {
      console.error('Error updating strategy:', error);
      toast({
        title: "Error",
        description: "Failed to update strategy",
        variant: "destructive"
      });
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    console.log('=== DELETE STRATEGY CALLED ===');
    console.log('Strategy ID:', strategyId);
    console.log('User Wallet:', userWallet);
    
    if (!userWallet) {
      console.log('ERROR: No user wallet provided');
      return;
    }

    if (!strategyId) {
      console.log('ERROR: No strategy ID provided');
      return;
    }

    try {
      console.log('Starting deletion process...');
      console.log('Current strategies count before deletion:', strategies.length);
      
      // Update local state immediately for better UX
      const originalStrategies = [...strategies];
      console.log('Backing up original strategies');
      
      setStrategies(prev => {
        const filtered = prev.filter(s => s.id !== strategyId);
        console.log('Updated local state, new count:', filtered.length);
        return filtered;
      });
      
      console.log('Making Supabase RPC delete request...');
      // Use RPC function for consistent deletion with type assertion
      const { data, error } = await supabase.rpc('delete_trading_strategy' as any, {
        p_strategy_id: strategyId,
        p_user_wallet: userWallet
      });

      console.log('Supabase RPC response - data:', data);
      console.log('Supabase RPC response - error:', error);

      if (error) {
        console.error('Database error deleting strategy:', error);
        console.log('Reverting local state due to error');
        setStrategies(originalStrategies);
        throw error;
      }
      
      console.log('Strategy deleted successfully from database via RPC');
      
      toast({
        title: "Success",
        description: "Strategy deleted successfully"
      });
      
      console.log('Refreshing strategies to ensure consistency...');
      // Refresh strategies to ensure consistency
      await fetchStrategies();
      console.log('=== DELETE STRATEGY COMPLETED ===');
    } catch (error) {
      console.error('Error in deleteStrategy function:', error);
      toast({
        title: "Error",
        description: "Failed to delete strategy",
        variant: "destructive"
      });
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
    updateStrategy,
    deleteStrategy,
    toggleStrategy,
    refreshStrategies: fetchStrategies
  };
};
