
interface RealTimePrice {
  dex: string;
  pair: string;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdate: string;
}

export class SubscriptionManagerService {
  private subscribers: Array<(data: RealTimePrice[]) => void> = [];

  subscribe(callback: (data: RealTimePrice[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers(data: RealTimePrice[]): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error notifying subscriber:', error);
      }
    });
  }

  getSubscriberCount(): number {
    return this.subscribers.length;
  }

  clearSubscribers(): void {
    this.subscribers = [];
  }
}

export const subscriptionManagerService = new SubscriptionManagerService();
