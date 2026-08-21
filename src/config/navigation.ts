/**
 * Navigation Configuration
 */

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  featureFlag?: keyof typeof import('./features').FEATURES_CONFIG;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'accounts', label: 'My Accounts', path: '/accounts', icon: 'WalletCards', badge: 'Active' },
  { id: 'deposit', label: 'Deposit', path: '/deposit', icon: 'ArrowDownToLine' },
  { id: 'withdrawal', label: 'Withdrawal', path: '/withdraw', icon: 'ArrowUpFromLine' },
  { id: 'transfer', label: 'Transfer', path: '/transfer', icon: 'ArrowLeftRight' },
  { id: 'transactions', label: 'Transactions', path: '/transactions', icon: 'ReceiptText' },
  { id: 'wallet', label: 'Crypto Wallet', path: '/wallet', icon: 'Coins', badge: 'Hot', featureFlag: 'cryptoWallet' },
  { id: 'orders', label: 'Order History', path: '/orders', icon: 'ClockHistory' },
  { id: 'performance', label: 'Performance', path: '/performance', icon: 'LineChart', featureFlag: 'performanceAnalytics' },
  { id: 'analytics', label: 'Market Analytics', path: '/analytics', icon: 'BarChart2', featureFlag: 'economicCalendar' },
  { id: 'copy-trading', label: 'Copy Trading', path: '/copy-trading', icon: 'Users2', badge: 'Pro', featureFlag: 'copyTrading' },
  { id: 'support', label: 'Support Hub', path: '/support', icon: 'Headphones' },
  { id: 'referrals', label: 'Invite & Earn', path: '/referrals', icon: 'Gift', featureFlag: 'referrals' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings' },
];

export const QUICK_APPS = [
  {
    id: 'web-terminal',
    name: 'TradeCore Web Terminal',
    description: 'High-speed browser charting & order execution',
    icon: 'CandlestickChart',
    type: 'internal_terminal',
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5 (MT5)',
    description: 'Download desktop or mobile trading terminal',
    icon: 'Monitor',
    type: 'download',
  },
  {
    id: 'mt4',
    name: 'MetaTrader 4 (MT4)',
    description: 'Classic algorithmic and forex platform',
    icon: 'Layers',
    type: 'download',
  },
  {
    id: 'economic-calendar',
    name: 'Economic Calendar',
    description: 'Real-time global macro events & releases',
    icon: 'Calendar',
    path: '/analytics',
  },
  {
    id: 'trading-calculator',
    name: 'Margin & Pip Calculator',
    description: 'Calculate position size, swap, and margin',
    icon: 'Calculator',
    path: '/analytics?tab=calculator',
  },
  {
    id: 'vps',
    name: 'Free Low-Latency VPS',
    description: '24/7 automated EA hosting with ultra-low latency',
    icon: 'Server',
    path: '/settings?tab=trading',
  },
  {
    id: 'partner-area',
    name: 'Partner & IB Area',
    description: 'Sub-IB tiers and multi-level affiliate commission',
    icon: 'ShieldCheck',
    path: '/referrals',
  },
  {
    id: 'help-center',
    name: 'Knowledge & FAQ Hub',
    description: 'Guides, videos, and live trading conditions',
    icon: 'BookOpen',
    path: '/support',
  }
];
