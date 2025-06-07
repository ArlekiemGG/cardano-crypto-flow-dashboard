
import { LucidEvolution } from '@lucid-evolution/lucid';
import { initializeLucid } from '@/utils/modernWalletUtils';
import { RealTradingExecutor, RealTradeRequest, RealTradeResult } from './RealTradingExecutor';
import { WalletValidator } from './WalletValidator';

export class RefactoredRealTradingService {
  private lucid: LucidEvolution | null = null;
  private executor = new RealTradingExecutor();
  private validator = new WalletValidator();

  async initializeLucid(): Promise<LucidEvolution> {
    if (!this.lucid) {
      this.lucid = await initializeLucid();
    }
    return this.lucid;
  }

  async executeRealArbitrageTrade(request: RealTradeRequest): Promise<RealTradeResult> {
    const lucid = await this.initializeLucid();
    return this.executor.executeRealArbitrageTrade(lucid, request);
  }

  async validateWalletForTrading(walletApi: any) {
    return this.validator.validateWalletForTrading(walletApi);
  }
}

export const refactoredRealTradingService = new RefactoredRealTradingService();
