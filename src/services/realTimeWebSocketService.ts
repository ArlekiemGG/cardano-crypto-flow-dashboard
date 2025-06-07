
class RealTimeWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number | null = null;
  private isConnecting = false;
  private abortController: AbortController | null = null;

  connect(url: string) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.abortController = new AbortController();

    try {
      this.ws = new WebSocket(url);
      
      this.ws.addEventListener('open', () => {
        console.log('🔗 WebSocket connected');
        this.isConnecting = false;
        this.clearReconnectInterval();
      }, { signal: this.abortController.signal });

      this.ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      }, { signal: this.abortController.signal });

      this.ws.addEventListener('close', () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnecting = false;
        this.scheduleReconnect();
      }, { signal: this.abortController.signal });

      this.ws.addEventListener('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
      }, { signal: this.abortController.signal });

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private handleMessage(data: any) {
    // Handle incoming WebSocket messages
    console.log('📨 WebSocket message received:', data);
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) return;
    
    this.reconnectInterval = window.setTimeout(() => {
      console.log('🔄 Attempting WebSocket reconnection...');
      this.reconnectInterval = null;
      // Reconnect logic would go here
    }, 5000);
  }

  private clearReconnectInterval() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  disconnect() {
    console.log('🛑 Disconnecting WebSocket service...');
    
    // Cancel any ongoing operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clear reconnection timer
    this.clearReconnectInterval();

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close(1000, 'Service shutting down');
      this.ws = null;
    }

    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const realTimeWebSocketService = new RealTimeWebSocketService();
