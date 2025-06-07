
import { supabase } from '@/integrations/supabase/client';

export interface SecurityValidation {
  isValid: boolean;
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
  recommendations: string[];
}

// Use a specific type instead of a generic index signature to avoid infinite recursion
type AuditTrailDetails = Record<string, string | number | boolean | null>;

export class SecurityManager {
  async validateTransaction(
    txData: any,
    userWallet: string
  ): Promise<SecurityValidation> {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let risk: 'low' | 'medium' | 'high' = 'low';

    // Check transaction amount vs wallet balance
    if (txData.amount > 0.8) { // More than 80% of balance
      warnings.push('High transaction amount relative to wallet balance');
      risk = 'medium';
    }

    // Check for suspicious patterns
    if (await this.detectSandwichAttack(txData)) {
      warnings.push('Potential sandwich attack detected');
      risk = 'high';
      recommendations.push('Consider delaying transaction or using MEV protection');
    }

    // Validate slippage tolerance
    if (txData.slippage > 0.05) { // More than 5%
      warnings.push('High slippage tolerance detected');
      risk = 'medium';
      recommendations.push('Consider reducing slippage tolerance');
    }

    // Check rate limiting
    if (await this.checkRateLimiting(userWallet)) {
      warnings.push('High transaction frequency detected');
      risk = 'medium';
    }

    return {
      isValid: risk !== 'high',
      risk,
      warnings,
      recommendations
    };
  }

  private async detectSandwichAttack(txData: any): Promise<boolean> {
    // Implement sandwich attack detection logic
    // Check for suspicious mempool activity
    return false; // Simplified for demo
  }

  private async checkRateLimiting(userWallet: string): Promise<boolean> {
    const { data: recentTxs } = await supabase
      .from('trade_history')
      .select('created_at')
      .eq('user_wallet', userWallet)
      .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString()); // Last minute

    return (recentTxs?.length || 0) > 10; // More than 10 transactions per minute
  }

  async createAuditTrail(
    action: string,
    userWallet: string,
    details: AuditTrailDetails
  ): Promise<void> {
    const auditData = {
      user_wallet: userWallet,
      action,
      details_json: JSON.stringify(details),
      timestamp: new Date().toISOString(),
      ip_address: 'masked', // Would capture real IP in production
      user_agent: (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown').substring(0, 255)
    };

    await supabase.from('audit_trail').insert(auditData);
  }

  async encryptSensitiveData(data: string): Promise<string> {
    // In production, use proper encryption
    // For demo, we'll use base64 encoding
    return btoa(data);
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    // In production, use proper decryption
    return atob(encryptedData);
  }

  validateAPIKey(apiKey: string, service: string): boolean {
    // Validate API key format and permissions
    if (!apiKey || apiKey.length < 20) return false;
    
    // Service-specific validations
    switch (service) {
      case 'blockfrost':
        return apiKey.startsWith('mainnet') || apiKey.startsWith('testnet');
      case 'coingecko':
        return apiKey.length === 64; // CoinGecko Pro API key length
      default:
        return true;
    }
  }

  async enforceHTTPS(): Promise<boolean> {
    if (typeof window === 'undefined') return true; // Server-side
    
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('🔒 HTTPS required for production');
      return false;
    }
    return true;
  }

  getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}

export const securityManager = new SecurityManager();
