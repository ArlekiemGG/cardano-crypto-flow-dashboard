
import { supabase } from '@/integrations/supabase/client';

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: string;
  error?: string;
}

export interface AlertConfig {
  type: 'email' | 'telegram' | 'webhook';
  threshold: number;
  enabled: boolean;
}

export class RealTimeMonitoring {
  private healthChecks = new Map<string, HealthCheck>();
  private alertConfig: AlertConfig[] = [];

  async monitorAPIHealth(): Promise<HealthCheck[]> {
    const services = [
      { name: 'Minswap', url: 'https://api.minswap.org' },
      { name: 'SundaeSwap', url: 'https://api.sundaeswap.finance' },
      { name: 'Blockfrost', url: 'https://cardano-mainnet.blockfrost.io' },
      { name: 'CoinGecko', url: 'https://api.coingecko.com' }
    ];

    const checks: HealthCheck[] = [];

    for (const service of services) {
      const check = await this.performHealthCheck(service.name, service.url);
      this.healthChecks.set(service.name, check);
      checks.push(check);
    }

    // Store health check results
    await this.storeHealthChecks(checks);

    return checks;
  }

  private async performHealthCheck(serviceName: string, url: string): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const latency = Date.now() - startTime;
      
      return {
        service: serviceName,
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'down',
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async monitorTransactionQueue(): Promise<{
    pending: number;
    failed: number;
    avgConfirmationTime: number;
  }> {
    const { data: transactions } = await supabase
      .from('trade_history')
      .select('status, timestamp')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const pending = transactions?.filter(tx => tx.status === 'pending').length || 0;
    const failed = transactions?.filter(tx => tx.status === 'failed').length || 0;
    
    // Calculate average confirmation time
    const confirmed = transactions?.filter(tx => tx.status === 'executed') || [];
    const avgConfirmationTime = confirmed.length > 0 
      ? confirmed.reduce((sum, tx) => {
          const created = new Date(tx.timestamp).getTime();
          const updated = new Date().getTime(); // Using current time as approximation
          return sum + (updated - created);
        }, 0) / confirmed.length / 1000 // Convert to seconds
      : 0;

    return { pending, failed, avgConfirmationTime };
  }

  async trackPerformanceMetrics(): Promise<{
    apiLatency: { [service: string]: number };
    errorRate: number;
    throughput: number;
  }> {
    const healthChecks = Array.from(this.healthChecks.values());
    
    const apiLatency: { [service: string]: number } = {};
    healthChecks.forEach(check => {
      apiLatency[check.service] = check.latency;
    });

    // Calculate error rate from recent transactions
    const { data: recentTxs } = await supabase
      .from('trade_history')
      .select('status')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    const errorRate = recentTxs?.length > 0 
      ? (recentTxs.filter(tx => tx.status === 'failed').length / recentTxs.length) * 100
      : 0;

    const throughput = recentTxs?.length || 0; // Transactions per hour

    return { apiLatency, errorRate, throughput };
  }

  async sendAlert(message: string, severity: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`);
    
    // Store alert in database
    await supabase.from('system_alerts').insert({
      message,
      severity,
      timestamp: new Date().toISOString(),
      resolved: false
    });

    // In production, this would send actual alerts via:
    // - Email (SendGrid/AWS SES)
    // - Telegram Bot
    // - Slack/Discord webhook
    // - SMS (Twilio)
  }

  private async storeHealthChecks(checks: HealthCheck[]): Promise<void> {
    const healthData = checks.map(check => ({
      service_name: check.service,
      status: check.status,
      latency_ms: check.latency,
      error_message: check.error,
      checked_at: check.lastCheck
    }));

    await supabase.from('health_checks').insert(healthData);
  }

  async getSystemStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'down';
    services: HealthCheck[];
    alerts: number;
  }> {
    const services = Array.from(this.healthChecks.values());
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downServices > 0) overall = 'down';
    else if (degradedServices > 0) overall = 'degraded';

    const { data: alerts } = await supabase
      .from('system_alerts')
      .select('id')
      .eq('resolved', false);

    return {
      overall,
      services,
      alerts: alerts?.length || 0
    };
  }
}

export const realTimeMonitoring = new RealTimeMonitoring();
