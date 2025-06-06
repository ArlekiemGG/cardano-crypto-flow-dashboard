
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationSettings, TradingPreferences, SettingsData } from '@/types/settings';

export const useSettingsData = () => {
  const { isConnected, address, walletName, network } = useWallet();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    tradeAlerts: true,
    arbitrageOpportunities: true,
    portfolioUpdates: false,
    systemMaintenance: true,
  });
  const [tradingPrefs, setTradingPrefs] = useState<TradingPreferences>({
    defaultSlippage: 0.5,
    maxGasFee: 2.0,
    autoExecuteThreshold: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadUserSettings();
    }
  }, [isConnected, address]);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('settings_json')
        .eq('wallet_address', address)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data?.settings_json) {
        const settings = data.settings_json as SettingsData;
        
        if (settings.notifications) {
          setNotifications(settings.notifications);
        }
        if (settings.tradingPreferences) {
          setTradingPrefs(settings.tradingPreferences);
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveUserSettings = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const settingsData: SettingsData = {
        notifications,
        tradingPreferences: tradingPrefs,
        walletName,
        network,
        lastUpdated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .upsert({
          wallet_address: address,
          settings_json: settingsData as any,
          last_login: new Date().toISOString(),
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return {
    notifications,
    toggleNotification,
    tradingPrefs,
    setTradingPrefs,
    isLoading,
    saveUserSettings,
  };
};
