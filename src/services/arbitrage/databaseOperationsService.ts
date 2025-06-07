
import { supabase } from '@/integrations/supabase/client';
import { ArbitrageOpportunityReal } from './types';

export class DatabaseOperationsService {
  async storeOpportunities(opportunities: ArbitrageOpportunityReal[]): Promise<void> {
    if (opportunities.length === 0) return;

    try {
      // Clean up old opportunities first
      await supabase
        .from('arbitrage_opportunities')
        .delete()
        .lt('timestamp', new Date(Date.now() - 3600000).toISOString()); // Remove older than 1 hour

      // Insert new opportunities with correct field mapping
      const opportunitiesData = opportunities.map(opp => ({
        dex_pair: opp.pair,
        source_dex_a: opp.buyDex,
        source_dex_b: opp.sellDex,
        price_a: opp.buyPrice,
        price_b: opp.sellPrice,
        price_diff: opp.sellPrice - opp.buyPrice,
        profit_potential: opp.profitPercentage,
        volume_available: opp.volumeAvailable,
        confidence_score: opp.confidence === 'HIGH' ? 90 : opp.confidence === 'MEDIUM' ? 70 : 50,
        expires_at: new Date(Date.now() + (opp.timeToExpiry * 1000)).toISOString(),
        timestamp: opp.timestamp,
        is_active: true
      }));

      const { error } = await supabase
        .from('arbitrage_opportunities')
        .insert(opportunitiesData);

      if (error) {
        console.error('Error storing arbitrage opportunities:', error);
      } else {
        console.log(`✅ Stored ${opportunities.length} arbitrage opportunities`);
      }
    } catch (error) {
      console.error('Error in storeOpportunities:', error);
    }
  }

  async getArbitragePerformance(days = 7): Promise<{
    totalOpportunities: number;
    avgProfitPercentage: number;
    successRate: number;
    totalVolume: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('arbitrage_opportunities')
      .select('profit_potential, volume_available, is_active')
      .gte('timestamp', startDate);

    if (error) {
      console.error('Error fetching arbitrage performance:', error);
      return { totalOpportunities: 0, avgProfitPercentage: 0, successRate: 0, totalVolume: 0 };
    }

    const totalOpportunities = data?.length || 0;
    const avgProfitPercentage = totalOpportunities > 0 
      ? data?.reduce((sum, opp) => sum + Number(opp.profit_potential), 0) / totalOpportunities || 0
      : 0;
    const successRate = totalOpportunities > 0 
      ? (data?.filter(opp => opp.is_active).length / totalOpportunities * 100) || 0
      : 0;
    const totalVolume = data?.reduce((sum, opp) => sum + Number(opp.volume_available), 0) || 0;

    return {
      totalOpportunities,
      avgProfitPercentage,
      successRate,
      totalVolume
    };
  }
}

export const databaseOperationsService = new DatabaseOperationsService();
