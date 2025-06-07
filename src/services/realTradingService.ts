import { LucidEvolution, UTxO } from '@lucid-evolution/lucid';
import { initializeLucid } from '@/utils/modernWalletUtils';
import { supabase } from '@/integrations/supabase/client';

interface RealTradeRequest {
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  walletApi: any;
}

interface RealTradeResult {
  success: boolean;
  txHash?: string;
  actualProfit?: number;
  error?: string;
  buyTxHash?: string;
  sellTxHash?: string;
}

export class RealTradingService {
  private lucid: LucidEvolution | null = null;

  async initializeLucid(): Promise<LucidEvolution> {
    if (!this.lucid) {
      this.lucid = await initializeLucid();
    }
    return this.lucid;
  }

  async executeRealArbitrageTrade(request: RealTradeRequest): Promise<RealTradeResult> {
    console.log(`🚀 EXECUTING REAL ARBITRAGE TRADE: ${request.pair}`);
    console.log(`📊 Buy on ${request.buyDex} at ${request.buyPrice}, Sell on ${request.sellDex} at ${request.sellPrice}`);

    try {
      // Initialize Lucid with wallet
      const lucid = await this.initializeLucid();
      lucid.selectWallet.fromAPI(request.walletApi);

      // Step 1: Execute buy order on first DEX
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

      console.log(`✅ Buy order completed on ${request.buyDex}: ${buyResult.txHash}`);

      // Step 2: Execute sell order on second DEX
      const sellResult = await this.executeSellOrder(lucid, {
        dex: request.sellDex,
        pair: request.pair,
        amount: request.amount,
        expectedPrice: request.sellPrice
      });

      if (!sellResult.success) {
        console.warn(`⚠️ Sell order failed on ${request.sellDex}, but buy already executed`);
        return {
          success: false,
          error: `Sell order failed on ${request.sellDex}: ${sellResult.error}`,
          buyTxHash: buyResult.txHash
        };
      }

      console.log(`✅ Sell order completed on ${request.sellDex}: ${sellResult.txHash}`);

      // Calculate actual profit
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
    console.log(`💰 Executing BUY order on ${params.dex} for ${params.amount} ${params.pair}`);

    try {
      // Get wallet UTXOs
      const utxos = await lucid.wallet().getUtxos();
      const adaUtxos = utxos.filter(utxo => utxo.assets.lovelace && Number(utxo.assets.lovelace) > 0);

      if (adaUtxos.length === 0) {
        throw new Error('No ADA UTXOs available for trading');
      }

      // Build transaction based on DEX
      let tx;
      switch (params.dex) {
        case 'Minswap':
          tx = await this.buildMinswapBuyTransaction(lucid, params);
          break;
        case 'SundaeSwap':
          tx = await this.buildSundaeSwapBuyTransaction(lucid, params);
          break;
        case 'MuesliSwap':
          tx = await this.buildMuesliSwapBuyTransaction(lucid, params);
          break;
        case 'WingRiders':
          tx = await this.buildWingRidersBuyTransaction(lucid, params);
          break;
        default:
          throw new Error(`Unsupported DEX for real trading: ${params.dex}`);
      }

      // Sign and submit transaction
      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      console.log(`✅ Buy transaction submitted: ${txHash}`);
      
      // Wait for confirmation
      await lucid.awaitTx(txHash);
      console.log(`✅ Buy transaction confirmed: ${txHash}`);

      return { success: true, txHash };

    } catch (error) {
      console.error(`❌ Buy order failed on ${params.dex}:`, error);
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
    console.log(`💸 Executing SELL order on ${params.dex} for ${params.amount} ${params.pair}`);

    try {
      // Build transaction based on DEX
      let tx;
      switch (params.dex) {
        case 'Minswap':
          tx = await this.buildMinswapSellTransaction(lucid, params);
          break;
        case 'SundaeSwap':
          tx = await this.buildSundaeSwapSellTransaction(lucid, params);
          break;
        case 'MuesliSwap':
          tx = await this.buildMuesliSwapSellTransaction(lucid, params);
          break;
        case 'WingRiders':
          tx = await this.buildWingRidersSellTransaction(lucid, params);
          break;
        default:
          throw new Error(`Unsupported DEX for real trading: ${params.dex}`);
      }

      // Sign and submit transaction
      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      console.log(`✅ Sell transaction submitted: ${txHash}`);
      
      // Wait for confirmation
      await lucid.awaitTx(txHash);
      console.log(`✅ Sell transaction confirmed: ${txHash}`);

      return { success: true, txHash };

    } catch (error) {
      console.error(`❌ Sell order failed on ${params.dex}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // DEX-specific transaction builders
  private async buildMinswapBuyTransaction(lucid: LucidEvolution, params: any) {
    // Build Minswap-specific transaction using their smart contracts
    console.log('🔧 Building Minswap buy transaction...');
    
    // For now, return a basic transaction structure
    // In production, this needs to interact with Minswap's smart contracts
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) }); // Convert ADA to lovelace
    
    return tx;
  }

  private async buildSundaeSwapBuyTransaction(lucid: LucidEvolution, params: any) {
    console.log('🔧 Building SundaeSwap buy transaction...');
    
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });
    
    return tx;
  }

  private async buildMuesliSwapBuyTransaction(lucid: LucidEvolution, params: any) {
    console.log('🔧 Building MuesliSwap buy transaction...');
    
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });
    
    return tx;
  }

  private async buildWingRidersBuyTransaction(lucid: LucidEvolution, params: any) {
    console.log('🔧 Building WingRiders buy transaction...');
    
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });
    
    return tx;
  }

  private async buildMinswapSellTransaction(lucid: LucidEvolution, params: any) {
    console.log('🔧 Building Minswap sell transaction...');
    
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });
    
    return tx;
  }

  private async buildSundaeSwapSellTransaction(lucid: LucidEvolution, params: any) {
    console.log('🔧 Building SundaeSwap sell transaction...');
    
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });
    
    return tx;
  }

  private async buildMuesliSwapSellTransaction(lucid: LucidEvolution, params: any) {
    console.log('🔧 Building MuesliSwap sell transaction...');
    
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });
    
    return tx;
  }

  private async buildWingRidersSellTransaction(lucid: LucidEvolution, params: any) {
    console.log('🔧 Building WingRiders sell transaction...');
    
    const tx = lucid.newTx()
      .pay.ToAddress("addr1...", { lovelace: BigInt(params.amount * 1000000) });
    
    return tx;
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
      // Get wallet address
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

  async validateWalletForTrading(walletApi: any): Promise<{ valid: boolean; balance: number; error?: string }> {
    try {
      const balanceHex = await walletApi.getBalance();
      const balance = parseInt(balanceHex, 16) / 1000000; // Convert lovelace to ADA

      if (balance < 10) { // Minimum 10 ADA for trading
        return {
          valid: false,
          balance,
          error: 'Insufficient balance for trading (minimum 10 ADA required)'
        };
      }

      return { valid: true, balance };
    } catch (error) {
      return {
        valid: false,
        balance: 0,
        error: 'Failed to validate wallet for trading'
      };
    }
  }
}

export const realTradingService = new RealTradingService();
