
interface StateSubscriber<T> {
  callback: (state: T) => void;
  id: string;
}

export class StateManager<T> {
  private state: T;
  private subscribers: StateSubscriber<T>[] = [];
  private lastUpdateTime = 0;
  private throttleMs = 100; // Throttle updates to prevent excessive re-renders

  constructor(initialState: T) {
    this.state = { ...initialState };
  }

  getState(): T {
    return { ...this.state };
  }

  setState(newState: Partial<T>): void {
    const now = Date.now();
    
    // Throttle state updates
    if (now - this.lastUpdateTime < this.throttleMs) {
      return;
    }

    const previousState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.lastUpdateTime = now;

    // Only notify if state actually changed
    if (this.hasStateChanged(previousState, this.state)) {
      this.notifySubscribers();
    }
  }

  subscribe(id: string, callback: (state: T) => void): () => void {
    const subscriber: StateSubscriber<T> = { id, callback };
    this.subscribers.push(subscriber);

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub.id !== id);
    };
  }

  private hasStateChanged(prev: T, current: T): boolean {
    return JSON.stringify(prev) !== JSON.stringify(current);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber.callback(this.state);
      } catch (error) {
        console.error(`Error in state subscriber ${subscriber.id}:`, error);
      }
    });
  }

  setThrottleMs(ms: number): void {
    this.throttleMs = ms;
  }

  getSubscriberCount(): number {
    return this.subscribers.length;
  }
}
