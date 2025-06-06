
import { optimizedDataService } from './optimizedDataService';

export class DataFlowDiagnostics {
  private static instance: DataFlowDiagnostics;
  private diagnosticLog: string[] = [];

  static getInstance(): DataFlowDiagnostics {
    if (!DataFlowDiagnostics.instance) {
      DataFlowDiagnostics.instance = new DataFlowDiagnostics();
    }
    return DataFlowDiagnostics.instance;
  }

  async performFullDiagnosis() {
    this.diagnosticLog = [];
    this.log('🔍 Iniciando diagnóstico completo del sistema...');

    // 1. Test Supabase connection
    await this.testSupabaseConnection();
    
    // 2. Test market data flow
    await this.testMarketDataFlow();
    
    // 3. Test optimized data service
    await this.testOptimizedDataService();
    
    // 4. Generate report
    return this.generateDiagnosticReport();
  }

  private async testSupabaseConnection() {
    try {
      this.log('📊 Probando conexión a Supabase...');
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('count(*)')
        .limit(1);

      if (error) {
        this.log(`❌ Error de conexión Supabase: ${error.message}`);
        return false;
      }

      this.log('✅ Conexión a Supabase exitosa');
      
      // Test recent data
      const { data: recentData } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      this.log(`📈 Datos recientes encontrados: ${recentData?.length || 0} entradas`);
      return true;
    } catch (error) {
      this.log(`❌ Error crítico en Supabase: ${error}`);
      return false;
    }
  }

  private async testMarketDataFlow() {
    try {
      this.log('🔄 Probando flujo de datos de mercado...');
      
      // Test edge function call
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('fetch-dex-data', {
        body: JSON.stringify({ action: 'fetch_all' })
      });

      if (error) {
        this.log(`❌ Error en edge function: ${error.message}`);
        return false;
      }

      this.log('✅ Edge function respondió correctamente');
      this.log(`📊 Datos devueltos: ${JSON.stringify(data, null, 2)}`);
      return true;
    } catch (error) {
      this.log(`❌ Error en flujo de datos: ${error}`);
      return false;
    }
  }

  private async testOptimizedDataService() {
    try {
      this.log('⚡ Probando servicio optimizado de datos...');
      
      // Test price fetching
      const prices = await optimizedDataService.getCurrentPrices(['ADA/USD']);
      this.log(`💰 Precios obtenidos: ${Object.keys(prices).length} entradas`);
      
      // Test protocols
      const protocols = await optimizedDataService.getCardanoProtocols();
      this.log(`🏦 Protocolos obtenidos: ${protocols.length} protocolos`);
      
      // Test DEX volumes
      const volumes = await optimizedDataService.getCardanoDexVolumes();
      this.log(`📈 Volúmenes DEX obtenidos: ${volumes?.protocols?.length || 0} DEXs`);
      
      return true;
    } catch (error) {
      this.log(`❌ Error en servicio optimizado: ${error}`);
      return false;
    }
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.diagnosticLog.push(logEntry);
    console.log(logEntry);
  }

  private generateDiagnosticReport() {
    const report = {
      timestamp: new Date().toISOString(),
      logs: this.diagnosticLog,
      summary: {
        totalTests: 3,
        passed: this.diagnosticLog.filter(log => log.includes('✅')).length,
        failed: this.diagnosticLog.filter(log => log.includes('❌')).length,
        warnings: this.diagnosticLog.filter(log => log.includes('⚠️')).length
      }
    };

    this.log(`📋 Diagnóstico completado - Exitosos: ${report.summary.passed}, Fallidos: ${report.summary.failed}`);
    return report;
  }

  getDiagnosticLogs(): string[] {
    return this.diagnosticLog;
  }
}

export const dataFlowDiagnostics = DataFlowDiagnostics.getInstance();
