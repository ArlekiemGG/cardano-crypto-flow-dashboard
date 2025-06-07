
import { useState, useCallback } from 'react';
import { realTradingService } from '@/services/realTradingService';
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
    console.log(`🚀 EXECUTING REAL ARBITRAGE TRADE for ${opportunity.pair}...`);

    try {
      // Check if wallet is connected
      const walletApi = window.cardano?.eternl || window.cardano?.nami || window.cardano?.vespr;
      if (!walletApi || !walletApi.isEnabled) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      // Validate wallet for trading
      const walletValidation = await realTradingService.validateWalletForTrading(walletApi);
      if (!walletValidation.valid) {
        throw new Error(walletValidation.error || 'Wallet validation failed');
      }

      console.log(`💰 Wallet validated: ${walletValidation.balance} ADA available`);

      // Get wallet address
      const changeAddress = await walletApi.getChangeAddress();
      const walletAddress = changeAddress || 'unknown';

      // Execute the real arbitrage trade
      const result = await realTradingService.executeRealArbitrageTrade({
        pair: opportunity.pair,
        buyDex: opportunity.buyDex,
        sellDex: opportunity.sellDex,
        buyPrice: opportunity.buyPrice,
        sellPrice: opportunity.sellPrice,
        amount: Math.min(opportunity.volumeAvailable, walletValidation.balance * 0.5), // Use max 50% of balance
        walletApi
      });

      if (result.success) {
        console.log(`✅ REAL ARBITRAGE TRADE SUCCESSFUL!`);
        console.log(`💰 Actual profit: ${result.actualProfit?.toFixed(4)} ADA`);
        console.log(`📋 Transaction hashes: ${result.txHash}`);

        return {
          success: true,
          txHash: result.txHash,
          actualProfit: result.actualProfit,
          buyTxHash: result.buyTxHash,
          sellTxHash: result.sellTxHash
        };
      } else {
        console.error(`❌ REAL ARBITRAGE TRADE FAILED: ${result.error}`);
        
        // If we have a buy transaction but sell failed, record partial execution
        if (result.buyTxHash) {
          await supabase.from('trade_history').insert({
            wallet_address: walletAddress,
            pair: opportunity.pair,
            trade_type: 'arbitrage',
            amount: opportunity.volumeAvailable,
            profit_loss: -opportunity.totalFees, // Record as loss due to fees
            dex_name: `${opportunity.buyDex}-${opportunity.sellDex}`,
            status: 'failed',
            tx_hash: result.buyTxHash,
            metadata_json: {
              pair: opportunity.pair,
              buyDex: opportunity.buyDex,
              sellDex: opportunity.sellDex,
              buyTxHash: result.buyTxHash,
              error: result.error,
              partialExecution: true,
              realTrade: true
            }
          });
        }

        return {
          success: false,
          error: result.error,
          buyTxHash: result.buyTxHash
        };
      }

    } catch (error) {
      console.error('❌ Error executing REAL arbitrage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
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

    console.log(`🧪 Simulating execution for ${opportunity.pair} (for validation only)`);

    try {
      // Check wallet connection for simulation
      const walletApi = window.cardano?.eternl || window.cardano?.nami || window.cardano?.vespr;
      if (!walletApi || !walletApi.isEnabled) {
        return {
          success: false,
          error: 'No wallet connected for simulation'
        };
      }

      const walletValidation = await realTradingService.validateWalletForTrading(walletApi);
      
      return {
        success: walletValidation.valid,
        estimatedProfit: opportunity.netProfit,
        estimatedSlippage: opportunity.slippageRisk,
        timeEstimate: 120, // 2 minutes estimate for real trades
        error: walletValidation.error
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
      !executingTrades.has(opp.id) &&
      opp.netProfit > 5 // Only auto-execute if profit is more than 5 ADA
    );

    console.log(`🤖 AUTO-EXECUTING ${highConfidenceOps.length} HIGH CONFIDENCE REAL TRADES...`);

    if (highConfidenceOps.length === 0) {
      console.log('📊 No high-confidence opportunities available for auto-execution');
      return { executed: 0, successful: 0 };
    }

    const results = await Promise.allSettled(
      highConfidenceOps.map(opp => executeArbitrage(opp.id))
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    console.log(`✅ AUTO-EXECUTION COMPLETED: ${successful}/${highConfidenceOps.length} SUCCESSFUL REAL TRADES`);

    return { executed: highConfidenceOps.length, successful };
  }, [opportunities, executingTrades, executeArbitrage]);

  return {
    executingTrades,
    executeArbitrage,
    simulateExecution,
    autoExecuteHighConfidence
  };
};
