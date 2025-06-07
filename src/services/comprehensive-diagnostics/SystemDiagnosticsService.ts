
import { supabase } from '@/integrations/supabase/client';
import { realTimeMarketDataService } from '@/services/realTimeMarketDataService';
import { optimizedDataService } from '@/services/optimized-data/OptimizedDataService';

interface DiagnosticResult {
  service: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  data?: any;
  latency?: number;
}

interface ComprehensiveDiagnostic {
  timestamp: string;
  overallHealth: 'healthy' | 'degraded' | 'critical';
  results: DiagnosticResult[];
  recommendations: string[];
  dataQuality: {
    realTimeDataAvailable: boolean;
    apiCoverage: number;
    dataFreshness: number;
  };
}

class SystemDiagnosticsService {
  async performComprehensiveDiagnosis(): Promise<ComprehensiveDiagnostic> {
    console.log('🔍 Starting comprehensive system diagnosis...');
    
    const startTime = Date.now();
    const results: DiagnosticResult[] = [];
    const recommendations: string[] = [];

    // Test Supabase connection
    const supabaseResult = await this.testSupabaseConnection();
    results.push(supabaseResult);

    // Test Real-time Market Data Service
    const marketDataResult = await this.testRealTimeMarketData();
    results.push(marketDataResult);

    // Test Optimized Data Service
    const optimizedDataResult = await this.testOptimizedDataService();
    results.push(optimizedDataResult);

    // Test Edge Function Health
    const edgeFunctionResult = await this.testEdgeFunctionHealth();
    results.push(edgeFunctionResult);

    // Test Database Performance
    const dbPerformanceResult = await this.testDatabasePerformance();
    results.push(dbPerformanceResult);

    // Calculate overall health
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorCount > 2) {
      overallHealth = 'critical';
    } else if (errorCount > 0 || warningCount > 2) {
      overallHealth = 'degraded';
    }

    // Generate recommendations
    if (errorCount > 0) {
      recommendations.push('Critical issues detected - immediate attention required');
    }
    if (warningCount > 0) {
      recommendations.push('Performance issues detected - consider optimization');
    }

    // Calculate data quality metrics
    const successfulServices = results.filter(r => r.status === 'success').length;
    const dataQuality = {
      realTimeDataAvailable: marketDataResult.status === 'success',
      apiCoverage: (successfulServices / results.length) * 100,
      dataFreshness: this.calculateDataFreshness(results)
    };

    const totalTime = Date.now() - startTime;
    console.log(`✅ Comprehensive diagnosis completed in ${totalTime}ms`);

    return {
      timestamp: new Date().toISOString(),
      overallHealth,
      results,
      recommendations,
      dataQuality
    };
  }

  private async testSupabaseConnection(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      // Simple connection test - use a basic query instead of accessing 'count'
      const { data, error } = await supabase.from('market_data_cache').select('id').limit(1);
      const latency = Date.now() - startTime;

      if (error) {
        return {
          service: 'Supabase Database Connection',
          status: 'error',
          message: `Connection failed: ${error.message}`,
          latency
        };
      }

      return {
        service: 'Supabase Database Connection',
        status: 'success',
        message: 'Database connection healthy',
        latency,
        data: { connected: true, responseTime: latency }
      };
    } catch (error) {
      return {
        service: 'Supabase Database Connection',
        status: 'error',
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency: Date.now() - startTime
      };
    }
  }

  private async testRealTimeMarketData(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const isConnected = realTimeMarketDataService.isConnected();
      const marketData = realTimeMarketDataService.getCurrentPrices();
      const latency = Date.now() - startTime;

      if (!isConnected) {
        return {
          service: 'Real-time Market Data Service',
          status: 'warning',
          message: 'Service not connected - attempting reconnection',
          latency
        };
      }

      return {
        service: 'Real-time Market Data Service',
        status: 'success',
        message: `Connected with ${marketData.length} data points`,
        latency,
        data: { 
          connected: isConnected, 
          dataPoints: marketData.length,
          lastUpdate: marketData[0]?.lastUpdate || 'N/A'
        }
      };
    } catch (error) {
      return {
        service: 'Real-time Market Data Service',
        status: 'error',
        message: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency: Date.now() - startTime
      };
    }
  }

  private async testOptimizedDataService(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      // Check if the service has the expected methods
      if (typeof optimizedDataService.isApiConnected !== 'function') {
        return {
          service: 'Optimized Data Service',
          status: 'error',
          message: 'Service not properly initialized',
          latency: Date.now() - startTime
        };
      }

      const isConnected = optimizedDataService.isApiConnected();
      const latency = Date.now() - startTime;

      if (!isConnected) {
        return {
          service: 'Optimized Data Service',
          status: 'warning',
          message: 'API connection not active',
          latency
        };
      }

      return {
        service: 'Optimized Data Service',
        status: 'success',
        message: 'API connection active and responding',
        latency,
        data: { 
          apiConnected: isConnected,
          cacheStats: optimizedDataService.getCacheStats ? optimizedDataService.getCacheStats() : {}
        }
      };
    } catch (error) {
      return {
        service: 'Optimized Data Service',
        status: 'error',
        message: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency: Date.now() - startTime
      };
    }
  }

  private async testEdgeFunctionHealth(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          service: 'Edge Function Health',
          status: 'warning',
          message: `Edge function responded with status ${response.status}`,
          latency
        };
      }

      return {
        service: 'Edge Function Health',
        status: 'success',
        message: 'Edge functions responding normally',
        latency,
        data: { 
          status: response.status,
          available: true
        }
      };
    } catch (error) {
      return {
        service: 'Edge Function Health',
        status: 'error',
        message: `Edge function unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency: Date.now() - startTime
      };
    }
  }

  private async testDatabasePerformance(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      // Test database query performance
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('id, timestamp')
        .limit(10);
      
      const latency = Date.now() - startTime;

      if (error) {
        return {
          service: 'Database Performance',
          status: 'error',
          message: `Query failed: ${error.message}`,
          latency
        };
      }

      const status = latency > 1000 ? 'warning' : 'success';
      const message = latency > 1000 ? 
        `Slow query performance: ${latency}ms` : 
        `Good query performance: ${latency}ms`;

      return {
        service: 'Database Performance',
        status,
        message,
        latency,
        data: { 
          queryTime: latency,
          recordsReturned: data?.length || 0
        }
      };
    } catch (error) {
      return {
        service: 'Database Performance',
        status: 'error',
        message: `Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency: Date.now() - startTime
      };
    }
  }

  private calculateDataFreshness(results: DiagnosticResult[]): number {
    // Calculate freshness based on successful services and their response times
    const successfulResults = results.filter(r => r.status === 'success');
    if (successfulResults.length === 0) return 0;

    const avgLatency = successfulResults.reduce((sum, r) => sum + (r.latency || 0), 0) / successfulResults.length;
    
    // Convert latency to freshness score (lower latency = higher freshness)
    const freshnessScore = Math.max(0, 1 - (avgLatency / 5000)); // 5 seconds max for full score
    
    return freshnessScore;
  }
}

export const systemDiagnostics = new SystemDiagnosticsService();
