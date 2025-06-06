
interface PerformanceMetrics {
  apiLatency: { [service: string]: number };
  errorRate: number;
  throughput: number;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    apiLatency: {},
    errorRate: 0,
    throughput: 0
  };

  trackAPILatency(service: string, latency: number): void {
    this.metrics.apiLatency[service] = latency;
  }

  updateErrorRate(rate: number): void {
    this.metrics.errorRate = rate;
  }

  updateThroughput(throughput: number): void {
    this.metrics.throughput = throughput;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  optimizePerformance(): void {
    console.log('🚀 Running performance optimizations...');
    // Performance optimization logic would go here
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.errorRate > 5) {
      recommendations.push('High error rate detected - consider implementing circuit breaker');
    }
    
    Object.entries(this.metrics.apiLatency).forEach(([service, latency]) => {
      if (latency > 1000) {
        recommendations.push(`High latency detected for ${service} - consider caching`);
      }
    });

    return recommendations;
  }
}

export const performanceOptimizer = new PerformanceOptimizer();
