
export class IntervalManagerService {
  private updateInterval: NodeJS.Timeout | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RECONNECT_INTERVAL = 120000;

  startUpdateInterval(callback: () => void, intervalMs: number): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(callback, intervalMs);
  }

  stopUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  incrementRetryCount(): boolean {
    this.retryCount++;
    console.error(`❌ Update failed (${this.retryCount}/${this.MAX_RETRIES})`);
    return this.retryCount >= this.MAX_RETRIES;
  }

  resetRetryCount(): void {
    this.retryCount = 0;
  }

  scheduleReconnect(callback: () => Promise<void>): void {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setInterval(async () => {
      try {
        console.log('🔄 Attempting to reconnect...');
        await callback();
        
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
        this.resetRetryCount();
        console.log('✅ Reconnection successful');
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, this.RECONNECT_INTERVAL);
  }

  stopReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  cleanup(): void {
    this.stopUpdateInterval();
    this.stopReconnectInterval();
    this.resetRetryCount();
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  getMaxRetries(): number {
    return this.MAX_RETRIES;
  }
}

export const intervalManagerService = new IntervalManagerService();
