
import { ExtendedMarketData } from './types';

export class OpportunityValidationService {
  isValidPriceEntry(price: any): boolean {
    return price.price > 0.001 && 
           price.price < 100 && 
           price.volume24h > 0 &&
           price.source !== 'CoinGecko' && // Exclude reference prices
           price.symbol && 
           price.symbol !== 'UNKNOWN';
  }

  prepareMarketData(currentPrices: any[]): ExtendedMarketData[] {
    return currentPrices
      .filter(price => this.isValidPriceEntry(price))
      .map(price => ({
        pair: `${price.symbol}/USD`,
        dex: price.source || 'Unknown',
        price: price.price,
        volume24h: Math.max(price.volume24h, 1000), // Ensure minimum volume
        liquidity: Math.max(price.volume24h * 0.15, 1000) // Improved liquidity estimation
      }));
  }
}

export const opportunityValidationService = new OpportunityValidationService();
