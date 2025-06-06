
interface WebSocketMessage {
  type: 'price_update' | 'arbitrage_opportunity' | 'dex_status' | 'heartbeat';
  data: any;
  timestamp: string;
}

interface ConnectionConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

class RealTimeWebSocketService {
  private connections = new Map<string, WebSocket>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private reconnectAttempts = new Map<string, number>();
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>();
  private isReconnecting = new Map<string, boolean>();

  private readonly DEFAULT_CONFIG: ConnectionConfig = {
    url: '',
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000 // 30 seconds
  };

  async connect(endpoint: string, config: Partial<ConnectionConfig> = {}): Promise<boolean> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      console.log(`🔌 Connecting to WebSocket: ${endpoint}`);
      
      if (this.connections.has(endpoint)) {
        console.log(`⚠️ Connection already exists for ${endpoint}`);
        return true;
      }

      const ws = new WebSocket(finalConfig.url || endpoint);
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected: ${endpoint}`);
        this.connections.set(endpoint, ws);
        this.reconnectAttempts.set(endpoint, 0);
        this.isReconnecting.set(endpoint, false);
        this.startHeartbeat(endpoint, finalConfig.heartbeatInterval);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(endpoint, message);
        } catch (error) {
          console.error(`❌ Error parsing WebSocket message from ${endpoint}:`, error);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: ${endpoint}, Code: ${event.code}`);
        this.cleanup(endpoint);
        
        if (!this.isReconnecting.get(endpoint)) {
          this.scheduleReconnect(endpoint, finalConfig);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error for ${endpoint}:`, error);
      };

      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to ${endpoint}:`, error);
      return false;
    }
  }

  private handleMessage(endpoint: string, message: WebSocketMessage) {
    const subscribers = this.subscribers.get(endpoint);
    if (!subscribers) return;

    subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error(`❌ Error in WebSocket subscriber for ${endpoint}:`, error);
      }
    });
  }

  private startHeartbeat(endpoint: string, interval: number) {
    const heartbeatId = setInterval(() => {
      const ws = this.connections.get(endpoint);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      }
    }, interval);

    this.heartbeatIntervals.set(endpoint, heartbeatId);
  }

  private cleanup(endpoint: string) {
    this.connections.delete(endpoint);
    
    const heartbeatId = this.heartbeatIntervals.get(endpoint);
    if (heartbeatId) {
      clearInterval(heartbeatId);
      this.heartbeatIntervals.delete(endpoint);
    }
  }

  private async scheduleReconnect(endpoint: string, config: ConnectionConfig) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;
    
    if (attempts >= config.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${endpoint}`);
      return;
    }

    this.isReconnecting.set(endpoint, true);
    this.reconnectAttempts.set(endpoint, attempts + 1);

    console.log(`🔄 Scheduling reconnection for ${endpoint} (attempt ${attempts + 1}/${config.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      if (!this.connections.has(endpoint)) {
        await this.connect(endpoint, config);
      }
    }, config.reconnectInterval * Math.pow(1.5, attempts)); // Exponential backoff
  }

  subscribe(endpoint: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(endpoint)) {
      this.subscribers.set(endpoint, new Set());
    }
    
    this.subscribers.get(endpoint)!.add(callback);
    
    return () => {
      const subscribers = this.subscribers.get(endpoint);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.disconnect(endpoint);
        }
      }
    };
  }

  disconnect(endpoint: string) {
    console.log(`🔌 Disconnecting from ${endpoint}`);
    
    const ws = this.connections.get(endpoint);
    if (ws) {
      ws.close();
    }
    
    this.cleanup(endpoint);
    this.subscribers.delete(endpoint);
    this.reconnectAttempts.delete(endpoint);
    this.isReconnecting.delete(endpoint);
  }

  disconnectAll() {
    console.log('🔌 Disconnecting all WebSocket connections');
    
    for (const endpoint of this.connections.keys()) {
      this.disconnect(endpoint);
    }
  }

  getConnectionStatus(endpoint: string): {
    connected: boolean;
    readyState?: number;
    reconnectAttempts: number;
  } {
    const ws = this.connections.get(endpoint);
    return {
      connected: ws?.readyState === WebSocket.OPEN,
      readyState: ws?.readyState,
      reconnectAttempts: this.reconnectAttempts.get(endpoint) || 0
    };
  }

  sendMessage(endpoint: string, message: any): boolean {
    const ws = this.connections.get(endpoint);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}

export const realTimeWebSocketService = new RealTimeWebSocketService();
