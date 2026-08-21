/**
 * Complete Data Model and Domain Types for TradeCore Client Portal
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccountStatus = 'real' | 'demo' | 'archived';
export type AccountType = 'standard' | 'pro' | 'raw_spread' | 'zero' | 'cent';
export type PlatformType = 'MT5' | 'MT4' | 'WebTerminal';
export type Leverage = '1:50' | '1:100' | '1:200' | '1:500' | '1:1000' | '1:2000' | '1:Unlimited';

export interface TradingAccount {
  id: string;
  accountNumber: string;
  nickname: string;
  status: AccountStatus;
  type: AccountType;
  platform: PlatformType;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  floatingPL: number;
  leverage: Leverage;
  isArchived: boolean;
  createdAt: string;
  lastActive: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  zipCode: string;
  postalCode?: string;
  dateOfBirth: string;
  avatarUrl?: string;
  tier: 'Standard' | 'Gold' | 'Platinum' | 'VIP';
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  identityVerified: boolean;
  addressVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'app' | 'sms' | 'email' | 'none';
  createdAt: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'adjustment' | 'rebate';
export type TransactionStatus = 'completed' | 'pending' | 'processing' | 'failed' | 'rejected';

export interface Transaction {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  accountId: string;
  accountNumber: string;
  toAccountId?: string;
  toAccountNumber?: string;
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  targetCurrency?: string;
  exchangeRate?: number;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  category: 'card' | 'bank' | 'e_wallet' | 'crypto' | 'mobile';
  icon: string;
  badge?: string;
  processingTime: string;
  feePercent: number;
  fixedFee: number;
  minAmount: number;
  maxAmount: number;
  supportedCurrencies: string[];
  recommended?: boolean;
  isInstant?: boolean;
  description: string;
}

export interface WalletAsset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  usdRate: number;
  usdValue: number;
  change24h: number;
  address: string;
  network: string;
  decimals: number;
}

export interface OrderPosition {
  id: string;
  ticket: string;
  accountId: string;
  accountNumber: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  status: 'open' | 'pending' | 'closed';
  volume: number;
  openPrice: number;
  currentPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  swap: number;
  commission: number;
  profit: number;
  openTime: string;
  closeTime?: string;
}

export interface CopyStrategy {
  id: string;
  name: string;
  traderName: string;
  traderAvatar: string;
  returnRate: number;
  monthlyReturn: number;
  riskScore: number; // 1 to 10
  maxDrawdown: number;
  investorsCount: number;
  aum: number;
  tradingDays: number;
  winRate: number;
  profitShare: number; // %
  minInvestment: number;
  equityHistory: { date: string; value: number }[];
  tags: string[];
  isPopular?: boolean;
  isVerified?: boolean;
}

export interface CopyInvestment {
  id: string;
  strategyId: string;
  strategyName: string;
  traderName: string;
  investedAmount: number;
  currentEquity: number;
  totalProfit: number;
  profitPercent: number;
  status: 'active' | 'paused' | 'closed';
  copyRatio: number;
  startedAt: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  date: string;
  country: string;
  countryCode: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous: string;
}

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: 'Forex' | 'Crypto' | 'Commodities' | 'Indices' | 'Central Banks';
  publishedAt: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  symbol?: string;
  readTime: string;
}

export interface PerformanceMetric {
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  tradingVolumeLots: number;
  sharpeRatio: number;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: 'funding' | 'trading' | 'account' | 'verification' | 'technical' | 'general';
  subject: string;
  status: 'open' | 'pending_agent' | 'pending_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: 'user' | 'agent' | 'system';
    senderName: string;
    avatarUrl?: string;
    message: string;
    timestamp: string;
    attachments?: string[];
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'account' | 'trading' | 'deposit' | 'withdrawal' | 'security' | 'verification' | 'system';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ReferralUser {
  id: string;
  clientName: string;
  joinedDate: string;
  country: string;
  status: 'active' | 'inactive';
  tradedVolumeLots: number;
  commissionEarned: number;
}

export interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

// Aliases and Compatibility Types
export type MarketNews = MarketNewsItem;
export type CopyTradingStrategy = CopyStrategy;
export type Order = OrderPosition;
export type PerformanceMetrics = PerformanceMetric;
export type UserSession = SecuritySession;

export interface ReferralItem {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  volumeLots: number;
  commissionEarned: number;
}

export interface ReferralData {
  tier: string;
  referralCode: string;
  referralLink: string;
  totalReferred: number;
  totalEarned: number;
  thisMonthEarned: number;
  referrals: ReferralItem[];
}

export interface WalletBalance {
  currency: string;
  amount: number;
  usdValue: number;
  network: string;
  address: string;
}

export interface CryptoWallet {
  totalUsdValue: number;
  balances: WalletBalance[];
}
