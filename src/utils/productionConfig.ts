
// Production configuration and environment management
export const PRODUCTION_CONFIG = {
  // Cardano Network Configuration
  CARDANO_NETWORK: process.env.NODE_ENV === 'production' ? 'Mainnet' : 'Testnet',
  
  // API Endpoints for Production
  BLOCKFROST_API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://cardano-mainnet.blockfrost.io/api/v0'
    : 'https://cardano-testnet.blockfrost.io/api/v0',
  
  // Rate Limiting Configuration
  RATE_LIMITS: {
    BLOCKFROST: { requests: 100, window: 60 }, // 100 requests per minute
    COINGECKO: { requests: 50, window: 60 },   // 50 requests per minute
    DEFILLAMA: { requests: 300, window: 60 },  // 300 requests per minute
    MINSWAP: { requests: 120, window: 60 },    // 120 requests per minute
  },
  
  // Cache Configuration
  CACHE_TTL: {
    PRICES: 30,        // 30 seconds for price data
    ARBITRAGE: 15,     // 15 seconds for arbitrage opportunities
    MARKET_DATA: 60,   // 1 minute for market data
    HEALTH_CHECKS: 300 // 5 minutes for health checks
  },
  
  // Security Configuration
  SECURITY: {
    MAX_TRANSACTION_AMOUNT: 10000, // Maximum transaction amount in ADA
    SLIPPAGE_WARNING_THRESHOLD: 0.05, // 5% slippage warning
    RATE_LIMIT_PER_WALLET: 10, // Transactions per minute per wallet
    SESSION_TIMEOUT: 3600, // 1 hour session timeout
  },
  
  // Monitoring Configuration
  MONITORING: {
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    ALERT_THRESHOLDS: {
      API_LATENCY: 5000,    // 5 seconds
      ERROR_RATE: 0.05,     // 5% error rate
      DOWNTIME: 60000,      // 1 minute downtime
    }
  },
  
  // Database Configuration
  DATABASE: {
    CONNECTION_POOL_SIZE: 20,
    QUERY_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
  }
};

export const validateProductionEnvironment = (): {
  isValid: boolean;
  missingConfig: string[];
  warnings: string[];
} => {
  const missingConfig: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      missingConfig.push(envVar);
    }
  });

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // Check HTTPS
    if (location.protocol !== 'https:') {
      warnings.push('HTTPS not enforced in production');
    }
    
    // Check for development artifacts
    if (location.hostname === 'localhost') {
      warnings.push('Running on localhost in production mode');
    }
  }

  return {
    isValid: missingConfig.length === 0,
    missingConfig,
    warnings
  };
};

export const getNetworkConfig = () => {
  const isMainnet = PRODUCTION_CONFIG.CARDANO_NETWORK === 'Mainnet';
  
  return {
    network: PRODUCTION_CONFIG.CARDANO_NETWORK,
    isMainnet,
    explorerUrl: isMainnet 
      ? 'https://cardanoscan.io'
      : 'https://testnet.cardanoscan.io',
    faucetUrl: isMainnet 
      ? null 
      : 'https://docs.cardano.org/cardano-testnet/tools/faucet/',
    blockfrostUrl: PRODUCTION_CONFIG.BLOCKFROST_API_URL
  };
};

export const logProductionInfo = () => {
  const config = getNetworkConfig();
  const validation = validateProductionEnvironment();
  
  console.log('🚀 Production Configuration Loaded');
  console.log(`📡 Network: ${config.network}`);
  console.log(`🔗 Explorer: ${config.explorerUrl}`);
  console.log(`✅ Configuration Valid: ${validation.isValid}`);
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Production Warnings:', validation.warnings);
  }
  
  if (validation.missingConfig.length > 0) {
    console.error('❌ Missing Configuration:', validation.missingConfig);
  }
};
