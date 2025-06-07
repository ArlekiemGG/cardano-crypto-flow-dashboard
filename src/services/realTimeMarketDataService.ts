
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
  private lastFetchTime = 0;
  private readonly FETCH_COOLDOWN = 60000; // 1 minute cooldown between fetches
  private readonly MAX_RETRIES = 3;
  private retryCount = 0;

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

  async startRealTimeUpdates(intervalSeconds: number = 60) {
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
    
    if (this.currentPrices.length > 0 && this.isDataFresh()) {
      callback(this.currentPrices);
    }
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private isDataFresh(): boolean {
    return Date.now() - this.lastFetchTime < this.FETCH_COOLDOWN;
  }

  private notifySubscribers() {
    if (this.subscribers.length === 0) return;
    
    this.subscribers.forEach(callback => {
      try {
        callback([...this.currentPrices]);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  private async setupRealtimeSubscription() {
    try {
      const subscription = supabase
        .channel('market_data_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'market_data_cache' },
          (payload) => {
            console.log('📊 Market data updated via realtime');
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
    this.dataUpdateInterval = window.setInterval(() => {
      if (!this.isActive || !this.canFetch()) return;
      
      this.fetchLatestData().catch(error => {
        console.error('Error in periodic update:', error);
      });
    }, 90000); // Update every 90 seconds
  }

  private canFetch(): boolean {
    const now = Date.now();
    return now - this.lastFetchTime >= this.FETCH_COOLDOWN;
  }

  private async fetchLatestData() {
    if (!this.isActive || this.abortController?.signal.aborted || !this.canFetch()) {
      return;
    }

    try {
      this.lastFetchTime = Date.now();
      
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20)
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString());

      if (error) throw error;

      if (data && data.length > 0) {
        const newPrices = data.map(item => ({
          symbol: item.pair?.split('/')[0] || 'UNKNOWN',
          price: item.price || 0,
          change24h: item.change_24h || 0,
          volume24h: item.volume_24h || 0,
          marketCap: item.market_cap || 0,
          lastUpdate: item.timestamp || new Date().toISOString(),
          source: item.source_dex || 'cache'
        }));
        
        if (this.hasDataChanged(newPrices)) {
          this.currentPrices = newPrices;
          this.notifySubscribers();
          this.retryCount = 0;
        }
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      this.retryCount++;
      if (this.retryCount < this.MAX_RETRIES) {
        setTimeout(() => this.fetchLatestData(), 5000 * this.retryCount);
      }
    }
  }

  private hasDataChanged(newPrices: MarketData[]): boolean {
    if (newPrices.length !== this.currentPrices.length) return true;
    
    return newPrices.some((newPrice, index) => {
      const currentPrice = this.currentPrices[index];
      return !currentPrice || 
             newPrice.price !== currentPrice.price || 
             newPrice.symbol !== currentPrice.symbol;
    });
  }

  private handleDataUpdate(payload: any) {
    if (!this.isActive) return;
    
    setTimeout(() => {
      this.fetchLatestData();
    }, 1000);
  }

  getCurrentPrices(): MarketData[] {
    return [...this.currentPrices];
  }

  isConnected(): boolean {
    return this.isActive && this.currentPrices.length > 0;
  }

  cleanup() {
    console.log('🧹 Cleaning up real-time market data service...');
    this.isActive = false;
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.subscribers = [];
    this.currentPrices = [];
    this.lastFetchTime = 0;
    this.retryCount = 0;
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();
