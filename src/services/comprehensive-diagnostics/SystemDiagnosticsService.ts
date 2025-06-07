
import { supabase } from '@/integrations/supabase/client';

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

export class SystemDiagnosticsService {
  private static instance: SystemDiagnosticsService;

  static getInstance(): SystemDiagnosticsService {
    if (!SystemDiagnosticsService.instance) {
      SystemDiagnosticsService.instance = new SystemDiagnosticsService();
    }
    return SystemDiagnosticsService.instance;
  }

  async performComprehensiveDiagnosis(): Promise<ComprehensiveDiagnostic> {
    console.log('🔍 Starting comprehensive system diagnosis...');
    
    const results: DiagnosticResult[] = [];
    const recommendations: string[] = [];
    
    // 1. Test Supabase Connection
    const supabaseResult = await this.testSupabaseConnection();
    results.push(supabaseResult);
    
    // 2. Test Edge Function
    const edgeFunctionResult = await this.testEdgeFunction();
    results.push(edgeFunctionResult);
    
    // 3. Test Data Cache Quality
    const cacheResult = await this.testDataCacheQuality();
    results.push(cacheResult);
    
    // 4. Test Real-time Data Sources
    const realTimeResult = await this.testRealTimeDataSources();
    results.push(realTimeResult);
    
    // 5. Test API Coverage
    const apiCoverageResult = await this.testAPICoverage();
    results.push(apiCoverageResult);
    
    // Generate overall health assessment
    const overallHealth = this.calculateOverallHealth(results);
    const dataQuality = this.assessDataQuality(results);
    
    // Generate recommendations
    if (overallHealth !== 'healthy') {
      recommendations.push(...this.generateRecommendations(results));
    }
    
    const diagnosis: ComprehensiveDiagnostic = {
      timestamp: new Date().toISOString(),
      overallHealth,
      results,
      recommendations,
      dataQuality
    };
    
    console.log('📊 Comprehensive diagnosis completed:', diagnosis);
    return diagnosis;
  }

  private async testSupabaseConnection(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('count(*)')
        .limit(1);
        
      const latency = Date.now() - startTime;
      
      if (error) {
        return {
          service: 'Supabase Database',
          status: 'error',
          message: `Connection failed: ${error.message}`,
          latency
        };
      }
      
      return {
        service: 'Supabase Database',
        status: 'success',
        message: 'Connected successfully',
        latency,
        data: { recordCount: data?.[0]?.count || 0 }
      };
    } catch (error) {
      return {
        service: 'Supabase Database',
        status: 'error',
        message: `Connection error: ${error}`,
        latency: Date.now() - startTime
      };
    }
  }

  private async testEdgeFunction(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return {
          service: 'Edge Function',
          status: 'error',
          message: `Edge function failed: ${error.message}`,
          latency
        };
      }
      
      return {
        service: 'Edge Function',
        status: 'success',
        message: 'Edge function responding correctly',
        latency,
        data: data
      };
    } catch (error) {
      return {
        service: 'Edge Function',
        status: 'error',
        message: `Edge function error: ${error}`,
        latency: Date.now() - startTime
      };
    }
  }

  private async testDataCacheQuality(): Promise<DiagnosticResult> {
    try {
      const { data: cachedData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
        
      if (error) {
        return {
          service: 'Data Cache',
          status: 'error',
          message: `Cache read error: ${error.message}`
        };
      }
      
      if (!cachedData || cachedData.length === 0) {
        return {
          service: 'Data Cache',
          status: 'error',
          message: 'No cached data available'
        };
      }
      
      // Analyze data quality
      const now = new Date().getTime();
      const recentData = cachedData.filter(item => {
        const itemTime = new Date(item.timestamp).getTime();
        return (now - itemTime) < 900000; // 15 minutes
      });
      
      const sources = [...new Set(cachedData.map(item => item.source_dex))];
      const adaPrice = cachedData.find(item => 
        item.pair === 'ADA/USD' && item.source_dex === 'CoinGecko'
      );
      
      let status: 'success' | 'warning' | 'error' = 'success';
      let message = `Cache healthy: ${recentData.length}/${cachedData.length} recent entries`;
      
      if (recentData.length < cachedData.length * 0.7) {
        status = 'warning';
        message = 'Some cached data is stale';
      }
      
      if (!adaPrice) {
        status = 'warning';
        message += ', Missing real ADA price from CoinGecko';
      }
      
      return {
        service: 'Data Cache',
        status,
        message,
        data: {
          totalEntries: cachedData.length,
          recentEntries: recentData.length,
          sources,
          hasADAPrice: !!adaPrice
        }
      };
    } catch (error) {
      return {
        service: 'Data Cache',
        status: 'error',
        message: `Cache analysis error: ${error}`
      };
    }
  }

  private async testRealTimeDataSources(): Promise<DiagnosticResult> {
    try {
      // Test if we're getting real-time data from external APIs
      const { data: recentData, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
        .order('timestamp', { ascending: false });
        
      if (error) {
        return {
          service: 'Real-time Data',
          status: 'error',
          message: `Real-time data check failed: ${error.message}`
        };
      }
      
      const defiLlamaData = recentData?.filter(item => item.source_dex === 'DeFiLlama') || [];
      const blockfrostData = recentData?.filter(item => item.source_dex === 'Blockfrost') || [];
      const coinGeckoData = recentData?.filter(item => item.source_dex === 'CoinGecko') || [];
      
      let status: 'success' | 'warning' | 'error' = 'success';
      let message = 'Real-time data flowing correctly';
      
      if (defiLlamaData.length === 0) {
        status = 'warning';
        message = 'No recent DeFiLlama data';
      }
      
      if (coinGeckoData.length === 0) {
        status = 'warning';
        message += ', No recent CoinGecko data';
      }
      
      return {
        service: 'Real-time Data',
        status,
        message,
        data: {
          defiLlamaEntries: defiLlamaData.length,
          blockfrostEntries: blockfrostData.length,
          coinGeckoEntries: coinGeckoData.length
        }
      };
    } catch (error) {
      return {
        service: 'Real-time Data',
        status: 'error',
        message: `Real-time data analysis error: ${error}`
      };
    }
  }

  private async testAPICoverage(): Promise<DiagnosticResult> {
    try {
      const { data: allData, error } = await supabase
        .from('market_data_cache')
        .select('source_dex, pair')
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString()); // Last hour
        
      if (error) {
        return {
          service: 'API Coverage',
          status: 'error',
          message: `API coverage check failed: ${error.message}`
        };
      }
      
      const expectedAPIs = ['DeFiLlama', 'CoinGecko', 'Blockfrost'];
      const presentAPIs = [...new Set(allData?.map(item => item.source_dex) || [])];
      const missingAPIs = expectedAPIs.filter(api => !presentAPIs.includes(api));
      
      const coverage = (presentAPIs.length / expectedAPIs.length) * 100;
      
      let status: 'success' | 'warning' | 'error' = 'success';
      if (coverage < 100) {
        status = coverage > 50 ? 'warning' : 'error';
      }
      
      return {
        service: 'API Coverage',
        status,
        message: `${coverage.toFixed(0)}% API coverage`,
        data: {
          expectedAPIs,
          presentAPIs,
          missingAPIs,
          coverage
        }
      };
    } catch (error) {
      return {
        service: 'API Coverage',
        status: 'error',
        message: `API coverage analysis error: ${error}`
      };
    }
  }

  private calculateOverallHealth(results: DiagnosticResult[]): 'healthy' | 'degraded' | 'critical' {
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    if (errorCount > 0) return 'critical';
    if (warningCount > 1) return 'degraded';
    return 'healthy';
  }

  private assessDataQuality(results: DiagnosticResult[]): any {
    const cacheResult = results.find(r => r.service === 'Data Cache');
    const realTimeResult = results.find(r => r.service === 'Real-time Data');
    const apiResult = results.find(r => r.service === 'API Coverage');
    
    return {
      realTimeDataAvailable: realTimeResult?.status === 'success',
      apiCoverage: apiResult?.data?.coverage || 0,
      dataFreshness: cacheResult?.data?.recentEntries / (cacheResult?.data?.totalEntries || 1)
    };
  }

  private generateRecommendations(results: DiagnosticResult[]): string[] {
    const recommendations: string[] = [];
    
    results.forEach(result => {
      if (result.status === 'error') {
        recommendations.push(`Fix ${result.service}: ${result.message}`);
      } else if (result.status === 'warning') {
        recommendations.push(`Improve ${result.service}: ${result.message}`);
      }
    });
    
    return recommendations;
  }
}

export const systemDiagnostics = SystemDiagnosticsService.getInstance();
