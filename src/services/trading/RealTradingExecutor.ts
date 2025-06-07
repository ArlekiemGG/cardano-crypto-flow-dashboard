
import { LucidEvolution } from '@lucid-evolution/lucid';
import { supabase } from '@/integrations/supabase/client';

export interface RealTradeRequest {
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  walletApi: any;
}

export interface RealTradeResult {
  success: boolean;
  txHash?: string;
  actualProfit?: number;
  error?: string;
  buyTxHash?: string;
  sellTxHash?: string;
}

export class RealTradingExecutor {
  async executeRealArbitrageTrade(
    lucid: LucidEvolution,
    request: RealTradeRequest
  ): Promise<RealTradeResult> {
    console.log(`🚀 EXECUTING REAL ARBITRAGE TRADE: ${request.pair}`);

    try {
      lucid.selectWallet.fromAPI(request.walletApi);

      // Step 1: Execute buy order
      const buyResult = await this.executeBuyOrder(lucid, {
        dex: request.buyDex,
        pair: request.pair,
        amount: request.amount,
        expectedPrice: request.buyPrice
      });

      if (!buyResult.success) {
        return {
          success: false,
          error: `Buy order failed on ${request.buyDex}: ${buyResult.error}`
        };
      }

      // Step 2: Execute sell order
      const sellResult = await this.executeSellOrder(lucid, {
        dex: request.sellDex,
        pair: request.pair,
        amount: request.amount,
        expectedPrice: request.sellPrice
      });

      if (!sellResult.success) {
        return {
          success: false,
          error: `Sell order failed on ${request.sellDex}: ${sellResult.error}`,
          buyTxHash: buyResult.txHash
        };
      }

      const actualProfit = (request.sellPrice - request.buyPrice) * request.amount;

      // Record successful trade
      await this.recordRealTrade({
        pair: request.pair,
        buyDex: request.buyDex,
        sellDex: request.sellDex,
        amount: request.amount,
        profit: actualProfit,
        buyTxHash: buyResult.txHash!,
        sellTxHash: sellResult.txHash!,
        walletApi: request.walletApi
      });

      return {
        success: true,
        txHash: `${buyResult.txHash}-${sellResult.txHash}`,
        actualProfit,
        buyTxHash: buyResult.txHash,
        sellTxHash: sellResult.txHash
      };

    } catch (error) {
      console.error('❌ Real trade execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeBuyOrder(lucid: LucidEvolution, params: {
    dex: string;
    pair: string;
    amount: number;
    expectedPrice: number;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    console.log(`💰 Executing BUY order on ${params.dex}`);

    try {
      const utxos = await lucid.wallet().getUtxos();
      const adaUtxos = utxos.filter(utxo => utxo.assets.lovelace && Number(utxo.assets.lovelace) > 0);

      if (adaUtxos.length === 0) {
        throw new Error('No ADA UTXOs available for trading');
      }

      // Build transaction
      const tx = lucid.newTx()
        .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });

      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      await lucid.awaitTx(txHash);
      return { success: true, txHash };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async executeSellOrder(lucid: LucidEvolution, params: {
    dex: string;
    pair: string;
    amount: number;
    expectedPrice: number;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    console.log(`💸 Executing SELL order on ${params.dex}`);

    try {
      const tx = lucid.newTx()
        .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });

      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      await lucid.awaitTx(txHash);
      return { success: true, txHash };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async recordRealTrade(trade: {
    pair: string;
    buyDex: string;
    sellDex: string;
    amount: number;
    profit: number;
    buyTxHash: string;
    sellTxHash: string;
    walletApi: any;
  }): Promise<void> {
    try {
      const changeAddress = await trade.walletApi.getChangeAddress();
      const walletAddress = changeAddress || 'unknown';

      await supabase.from('trade_history').insert({
        wallet_address: walletAddress,
        pair: trade.pair,
        trade_type: 'arbitrage',
        amount: trade.amount,
        profit_loss: trade.profit,
        dex_name: `${trade.buyDex}-${trade.sellDex}`,
        status: 'executed',
        tx_hash: `${trade.buyTxHash},${trade.sellTxHash}`,
        metadata_json: {
          pair: trade.pair,
          buyDex: trade.buyDex,
          sellDex: trade.sellDex,
          buyTxHash: trade.buyTxHash,
          sellTxHash: trade.sellTxHash,
          realTrade: true,
          executionTime: new Date().toISOString()
        }
      });

      console.log('✅ Real trade recorded in database');
    } catch (error) {
      console.error('❌ Failed to record real trade:', error);
    }
  }
}
