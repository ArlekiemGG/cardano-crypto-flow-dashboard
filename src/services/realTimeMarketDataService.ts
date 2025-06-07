
import { supabase } from '@/integrations/supabase/client';
import { MarketData } from '@/types/trading';

interface MarketDataSubscription {
  unsubscribe: () => void;
}

class RealTimeMarketDataService {
  private isActive = false;
  private currentPrices: MarketData[] = [];
  private subscription: MarketDataSubscription | null = null;
  private abortController: AbortController | null = null;
  private dataUpdateInterval: number | null = null;
  private subscribers: ((data: MarketData[]) => void)[] = [];

  async initialize() {
    if (this.isActive) return;
    
    console.log('🚀 Initializing real-time market data service...');
    this.isActive = true;
    this.abortController = new AbortController();

    try {
      await this.setupRealtimeSubscription();
      this.startPeriodicUpdates();
    } catch (error) {
      console.error('Error initializing market data service:', error);
      this.isActive = false;
    }
  }

  async startRealTimeUpdates(intervalSeconds: number = 45) {
    if (this.isActive) return;
    
    console.log(`🚀 Starting real-time updates every ${intervalSeconds} seconds...`);
    await this.initialize();
    
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
    }
    
    this.dataUpdateInterval = window.setInterval(() => {
      if (!this.isActive) return;
      
      this.fetchLatestData().catch(error => {
        console.error('Error in periodic update:', error);
      });
    }, intervalSeconds * 1000);
  }

  subscribe(callback: (data: MarketData[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately call with current data
    if (this.currentPrices.length > 0) {
      callback(this.currentPrices);
    }
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentPrices);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  private async setupRealtimeSubscription() {
    try {
      // Setup Supabase realtime subscription
      const subscription = supabase
        .channel('market_data_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'market_data_cache' },
          (payload) => {
            console.log('📊 Market data updated:', payload);
            this.handleDataUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log(`📊 Subscription status: ${status}`);
        });

      this.subscription = {
        unsubscribe: () => {
          supabase.removeChannel(subscription);
        }
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  }

  private startPeriodicUpdates() {
    // Use modern APIs instead of obsolete ones
    this.dataUpdateInterval = window.setInterval(() => {
      if (!this.isActive) return;
      
      this.fetchLatestData().catch(error => {
        console.error('Error in periodic update:', error);
      });
    }, 30000); // Update every 30 seconds
  }

  private async fetchLatestData() {
    if (!this.isActive || this.abortController?.signal.aborted) return;

    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        this.currentPrices = data.map(item => ({
          symbol: item.pair?.split('/')[0] || 'UNKNOWN',
          price: item.price || 0,
          change24h: item.change_24h || 0,
          volume24h: item.volume_24h || 0,
          marketCap: item.market_cap || 0,
          lastUpdate: item.timestamp || new Date().toISOString(),
          source: item.source_dex || 'cache'
        }));
        
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Error fetching latest data:', error);
    }
  }

  private handleDataUpdate(payload: any) {
    if (!this.isActive) return;
    
    // Process the real-time update
    console.log('Processing real-time market data update');
    this.fetchLatestData();
  }

  getCurrentPrices(): MarketData[] {
    return [...this.currentPrices];
  }

  isConnected(): boolean {
    return this.isActive && this.subscription !== null;
  }

  async cleanup() {
    console.log('🧹 Cleaning up real-time market data service...');
    this.isActive = false;

    // Cancel any ongoing operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clear periodic updates
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }

    // Unsubscribe from realtime updates
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    // Clear subscribers
    this.subscribers = [];
    this.currentPrices = [];
    console.log('✅ Real-time market data service cleaned up');
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
