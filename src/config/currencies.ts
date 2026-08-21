/**
 * Supported Currencies and FX Rates Configuration
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  rateToUSD: number; // For conversions
  isCrypto?: boolean;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, rateToUSD: 1.0 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, rateToUSD: 1.085 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, rateToUSD: 1.295 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0, rateToUSD: 0.0065 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2, rateToUSD: 0.655 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2, rateToUSD: 0.735 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2, rateToUSD: 1.12 },
  USDT: { code: 'USDT', name: 'Tether USD', symbol: '₮', decimals: 2, rateToUSD: 1.0, isCrypto: true },
  BTC: { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimals: 6, rateToUSD: 68420.0, isCrypto: true },
  ETH: { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimals: 5, rateToUSD: 3520.0, isCrypto: true },
};

export const ACCOUNT_TYPES_INFO = {
  standard: {
    name: 'Standard',
    minDeposit: 10,
    spread: 'From 0.3 pips',
    commission: '$0 / Zero Commission',
    leverage: '1:Unlimited',
    description: 'Our most popular account for all types of traders with zero markups and instant execution.',
    badge: 'Popular',
  },
  pro: {
    name: 'Pro Account',
    minDeposit: 200,
    spread: 'From 0.1 pips',
    commission: '$0 / No Commission',
    leverage: '1:Unlimited',
    description: 'Instant market execution with ultra-low spread and zero trading commissions.',
    badge: 'Best Value',
  },
  raw_spread: {
    name: 'Raw Spread',
    minDeposit: 200,
    spread: 'From 0.0 pips',
    commission: 'Up to $3.50 / lot',
    leverage: '1:Unlimited',
    description: 'True raw market spreads from top-tier liquidity providers with fixed low commission.',
    badge: 'Scalping & EAs',
  },
  zero: {
    name: 'Zero Spread',
    minDeposit: 200,
    spread: '0.0 pips on top 30 pairs',
    commission: 'From $0.20 / lot',
    leverage: '1:Unlimited',
    description: 'Guaranteed zero spread for 95% of the trading day on major forex pairs.',
    badge: 'Institutional',
  },
  cent: {
    name: 'Standard Cent',
    minDeposit: 10,
    spread: 'From 0.3 pips',
    commission: '$0 / No Commission',
    leverage: '1:Unlimited',
    description: 'Trade micro-lots and test algorithms with cents (USC) instead of full dollars.',
    badge: 'Beginner',
  },
};
