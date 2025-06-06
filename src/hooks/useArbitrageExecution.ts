
import { useState, useCallback } from 'react';
import { arbitrageEngine } from '@/services/arbitrageEngine';
import { supabase } from '@/integrations/supabase/client';

interface RealArbitrageOpportunity {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitPercentage: number;
  profitADA: number;
  volumeAvailable: number;
  totalFees: number;
  netProfit: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timeToExpiry: number;
  slippageRisk: number;
  liquidityScore: number;
  timestamp: string;
  executionReady: boolean;
}

export const useArbitrageExecution = (opportunities: RealArbitrageOpportunity[]) => {
  const [executingTrades, setExecutingTrades] = useState<Set<string>>(new Set());

  const executeArbitrage = useCallback(async (opportunityId: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity || executingTrades.has(opportunityId)) {
      return { success: false, error: 'Opportunity not found or already executing' };
    }

    setExecutingTrades(prev => new Set([...prev, opportunityId]));
    console.log(`🚀 Executing arbitrage trade for ${opportunity.pair}...`);

    try {
      const simulationResult = await arbitrageEngine.simulateTradeExecution(opportunity);
      
      if (simulationResult.success) {
        await supabase.from('trade_history').insert({
          pair: opportunity.pair,
          trade_type: 'arbitrage',
          amount: opportunity.volumeAvailable,
          profit_loss: simulationResult.estimatedProfit,
          dex_name: `${opportunity.buyDex}-${opportunity.sellDex}`,
          status: 'executed',
          tx_hash: `sim_${Date.now()}`,
          gas_fee: simulationResult.gasEstimate,
          metadata_json: {
            buyDex: opportunity.buyDex,
            sellDex: opportunity.sellDex,
            buyPrice: opportunity.buyPrice,
            sellPrice: opportunity.sellPrice,
            profitPercentage: opportunity.profitPercentage,
            slippageRisk: opportunity.slippageRisk,
            confidence: opportunity.confidence
          }
        });

        return {
          success: true,
          txHash: `sim_${Date.now()}`,
          actualProfit: simulationResult.estimatedProfit
        };
      } else {
        return {
          success: false,
          error: `Execution failed: ${simulationResult.estimatedSlippage}% slippage too high`
        };
      }

    } catch (error) {
      console.error('❌ Error executing arbitrage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setExecutingTrades(prev => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });
    }
  }, [opportunities, executingTrades]);

  const simulateExecution = useCallback(async (opportunityId: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    try {
      const simulationResult = await arbitrageEngine.simulateTradeExecution(opportunity);
      return {
        success: simulationResult.success,
        estimatedProfit: simulationResult.estimatedProfit,
        estimatedSlippage: simulationResult.estimatedSlippage,
        timeEstimate: simulationResult.timeEstimate || 30
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Simulation failed'
      };
    }
  }, [opportunities]);

  const autoExecuteHighConfidence = useCallback(async () => {
    const highConfidenceOps = opportunities.filter(opp => 
      opp.confidence === 'HIGH' && 
      opp.executionReady && 
      !executingTrades.has(opp.id)
    );

    console.log(`🤖 Auto-executing ${highConfidenceOps.length} high confidence opportunities...`);

    const results = await Promise.allSettled(
      highConfidenceOps.map(opp => executeArbitrage(opp.id))
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    console.log(`✅ Auto-execution completed: ${successful}/${highConfidenceOps.length} successful`);

    return { executed: highConfidenceOps.length, successful };
  }, [opportunities, executingTrades, executeArbitrage]);

  return {
    executingTrades,
    executeArbitrage,
    simulateExecution,
    autoExecuteHighConfidence
  };
};
