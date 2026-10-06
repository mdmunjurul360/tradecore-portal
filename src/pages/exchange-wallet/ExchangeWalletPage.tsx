import React, { useState, useEffect, useCallback } from 'react';
import {
  exchangeWalletService,
  ExchangeWalletSummary,
  WalletCoin,
  WalletNetwork,
  DepositRecord,
  WithdrawalRecord,
} from '../../services/mock/exchangeWalletService';
import { formatCurrency, formatNumber, truncateAddress, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  X,
  Search,
  ExternalLink,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  Lock,
  Activity,
  ChevronDown,
} from 'lucide-react';

type WalletTab = 'balances' | 'deposit' | 'withdraw' | 'deposit-history' | 'withdrawal-history';

// ──────── QR Code SVG Generator ────────
function QRCodeSVG({ data, size = 180 }: { data: string; size?: number }) {
  // Simple deterministic pattern based on address hash
  const seed = data.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gridSize = 21;
  const moduleSize = size / (gridSize + 2);

  const modules: boolean[][] = [];
  for (let row = 0; row < gridSize; row++) {
    modules[row] = [];
    for (let col = 0; col < gridSize; col++) {
      // Position detection patterns (3 corners)
      const isTopLeft = row < 7 && col < 7;
      const isTopRight = row < 7 && col >= gridSize - 7;
      const isBottomLeft = row >= gridSize - 7 && col < 7;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const localRow = isBottomLeft ? row - (gridSize - 7) : row;
        const localCol = isTopRight ? col - (gridSize - 7) : col;
        // Outer ring + inner + gap
        if (localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6) {
          modules[row][col] = true;
        } else if (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4) {
          modules[row][col] = true;
        } else {
          modules[row][col] = false;
        }
      } else {
        // Data area — use seed for deterministic pseudo-random
        const hash = ((seed * (row + 1) * 31 + col * 17 + row * col) % 100);
        modules[row][col] = hash > 45;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl">
      <rect width={size} height={size} fill="white" rx="8" />
      {modules.map((row, ri) =>
        row.map((cell, ci) =>
          cell ? (
            <rect
              key={`${ri}-${ci}`}
              x={(ci + 1) * moduleSize}
              y={(ri + 1) * moduleSize}
              width={moduleSize - 0.5}
              height={moduleSize - 0.5}
              fill="#0f172a"
              rx="1"
            />
          ) : null
        )
      )}
    </svg>
  );
}


// ──────── Explorer URL Helper ────────
function getExplorerUrl(coin: string, txHash: string): string {
  if (!txHash) return '#';
  const explorers: Record<string, string> = {
    BTC: `https://mempool.space/tx/${txHash}`,
    ETH: `https://etherscan.io/tx/0x${txHash}`,
    BNB: `https://bscscan.com/tx/0x${txHash}`,
    TRX: `https://tronscan.org/#/transaction/${txHash}`,
    USDT: `https://tronscan.org/#/transaction/${txHash}`,
    USDC: `https://etherscan.io/tx/0x${txHash}`,
    SOL: `https://solscan.io/tx/${txHash}`,
  };
  return explorers[coin] || '#';
}


// ──────── Main Component ────────
export const ExchangeWalletPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<WalletTab>('balances');
  const [summary, setSummary] = useState<ExchangeWalletSummary | null>(null);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawalList] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSmall, setHideSmall] = useState(false);
  const [copied, setCopied] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Deposit modal state
  const [depositCoin, setDepositCoin] = useState<WalletCoin | null>(null);
  const [depositNetwork, setDepositNetwork] = useState<WalletNetwork | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Withdrawal form state
  const [withdrawCoin, setWithdrawCoin] = useState<string>('');
  const [withdrawNetworkId, setWithdrawNetworkId] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<'form' | 'confirm'>('form');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // ──────── Data Loading ────────

  const loadData = useCallback(async () => {
    setLoading(true);
    const [walletSummary, depositHist, withdrawHist] = await Promise.all([
      exchangeWalletService.getWalletSummary(),
      exchangeWalletService.getDepositHistory(),
      exchangeWalletService.getWithdrawalHistory(),
    ]);
    setSummary(walletSummary);
    setDeposits(depositHist);
    setWithdrawalList(withdrawHist);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Polling for live balance updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const coins = await exchangeWalletService.refreshBalances();
      setSummary(prev => prev ? {
        ...prev,
        coins,
        totalUsdValue: coins.reduce((s, c) => s + c.usdValue, 0),
      } : null);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ──────── Actions ────────

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    showToast('info', 'Copied', label);
    setTimeout(() => setCopied(''), 2000);
  };

  const openDepositModal = (coin: WalletCoin) => {
    setDepositCoin(coin);
    const defaultNet = coin.networks.find(n => n.isDefault) || coin.networks[0];
    setDepositNetwork(defaultNet);
    setShowDepositModal(true);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (withdrawStep === 'form') {
      // Validate
      if (!withdrawCoin) { showToast('error', 'Select Coin', 'Please select a coin to withdraw.'); return; }
      if (!withdrawNetworkId) { showToast('error', 'Select Network', 'Please select a withdrawal network.'); return; }
      if (!withdrawAddress || withdrawAddress.length < 10) { showToast('error', 'Invalid Address', 'Please enter a valid withdrawal address.'); return; }
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) { showToast('error', 'Invalid Amount', 'Please enter a valid withdrawal amount.'); return; }

      const coin = summary?.coins.find(c => c.symbol === withdrawCoin);
      if (!coin) return;
      if (amount > coin.available) { showToast('error', 'Insufficient Balance', `Available: ${coin.available} ${coin.symbol}`); return; }

      const network = coin.networks.find(n => n.id === withdrawNetworkId);
      if (network && amount < network.minWithdraw) {
        showToast('error', 'Below Minimum', `Minimum withdrawal: ${network.minWithdraw} ${coin.symbol}`);
        return;
      }

      setWithdrawStep('confirm');
      return;
    }

    // Submit withdrawal
    setWithdrawSubmitting(true);
    try {
      await exchangeWalletService.submitWithdrawal({
        coin: withdrawCoin,
        networkId: withdrawNetworkId,
        address: withdrawAddress,
        amount: parseFloat(withdrawAmount),
      });
      showToast('success', 'Withdrawal Submitted', `Your ${withdrawCoin} withdrawal is being processed.`);
      setWithdrawStep('form');
      setWithdrawCoin('');
      setWithdrawNetworkId('');
      setWithdrawAddress('');
      setWithdrawAmount('');
      setActiveTab('withdrawal-history');
      await loadData();
    } catch (err: any) {
      showToast('error', 'Withdrawal Failed', err.message);
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // ──────── Computed ────────

  const filteredCoins = summary?.coins.filter(c => {
    const matchesSearch = c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const passesSmallFilter = !hideSmall || c.usdValue > 1;
    return matchesSearch && passesSmallFilter;
  }) || [];

  const selectedWithdrawCoin = summary?.coins.find(c => c.symbol === withdrawCoin);
  const selectedWithdrawNetwork = selectedWithdrawCoin?.networks.find(n => n.id === withdrawNetworkId);

  const withdrawalFee = selectedWithdrawNetwork?.withdrawFee || 0;
  const withdrawalNet = (parseFloat(withdrawAmount) || 0) - withdrawalFee;

  // ──────── Render ────────

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-cyan-400" />
            <span>Exchange Wallet</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Institutional custody • Multi-network deposits • Instant withdrawals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-2 rounded-xl bg-surface-alt hover:bg-surface-alt border border-default text-muted hover:text-cyan-400 transition-all cursor-pointer"
            title={balanceVisible ? 'Hide balances' : 'Show balances'}
          >
            {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-surface-alt hover:bg-surface-alt border border-default text-muted hover:text-cyan-400 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portfolio Summary Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-cyan-500/20 text-primary dark:text-white rounded-2xl p-6 sm:p-8 shadow-[0_0_25px_rgba(34,211,238,0.08)] backdrop-blur-xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">Total Balance</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-primary dark:text-white">
              {balanceVisible
                ? formatCurrency(summary?.totalUsdValue || 0, 'USD')
                : '••••••'
              }
            </h2>
            {summary && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${summary.changePercent24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.changePercent24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {summary.changePercent24h >= 0 ? '+' : ''}{summary.changePercent24h}% (24h)
              </div>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Available</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {balanceVisible ? formatCurrency(summary?.totalAvailable || 0, 'USD') : '••••••'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Locked</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {balanceVisible ? formatCurrency(summary?.totalLocked || 0, 'USD') : '••••••'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">In Order</span>
            <span className="text-lg font-bold font-mono text-indigo-400">
              {balanceVisible ? formatCurrency(summary?.totalInOrder || 0, 'USD') : '••••••'}
            </span>
          </div>
          <div className="flex items-end justify-start md:justify-end gap-2 col-span-2 md:col-span-1">
            <button
              onClick={() => setActiveTab('deposit')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-alt hover:bg-surface-alt text-primary dark:text-white font-bold text-xs border border-default transition-all cursor-pointer"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-1.5 shadow-lg">
        {([
          { key: 'balances', label: 'Balances', icon: Coins },
          { key: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
          { key: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
          { key: 'deposit-history', label: 'Deposit History', icon: Clock },
          { key: 'withdrawal-history', label: 'Withdrawal History', icon: Clock },
        ] as { key: WalletTab; label: string; icon: React.FC<{ className?: string }> }[]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key === 'withdraw') setWithdrawStep('form'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                  : 'text-muted hover:text-primary dark:hover:text-white hover:bg-surface-alt border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ──────── TAB: Balances ──────── */}
      {activeTab === 'balances' && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-subtle flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search coin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-default rounded-xl text-xs text-primary dark:text-white placeholder:text-muted outline-hidden focus:border-cyan-500/50"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideSmall}
                onChange={(e) => setHideSmall(e.target.checked)}
                className="w-4 h-4 rounded border-default accent-cyan-400"
              />
              Hide small balances
            </label>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-7 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-subtle bg-surface-alt/50">
            <span className="col-span-2">Coin</span>
            <span className="text-right">Total</span>
            <span className="text-right">Available</span>
            <span className="text-right">Locked</span>
            <span className="text-right">USD Value</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Coin Rows */}
          <div className="divide-y divide-subtle">
            {filteredCoins.map(coin => (
              <div key={coin.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-0 px-4 py-3.5 hover:bg-surface-alt/50 transition-colors items-center">
                {/* Coin info */}
                <div className="col-span-2 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold font-mono border shadow-md"
                    style={{
                      background: `${coin.iconColor}15`,
                      borderColor: `${coin.iconColor}30`,
                      color: coin.iconColor,
                    }}
                  >
                    {coin.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-primary dark:text-white">{coin.symbol}</span>
                    <span className="text-[10px] text-muted block">{coin.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </span>
                </div>

                {/* Total */}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-primary dark:text-white block md:inline">
                    {balanceVisible ? coin.balance.toFixed(coin.symbol === 'USDT' || coin.symbol === 'USDC' ? 2 : 4) : '••••'}
                  </span>
                  <span className="text-[10px] text-muted md:hidden ml-1">Total</span>
                </div>

                {/* Available */}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400 block md:inline">
                    {balanceVisible ? coin.available.toFixed(coin.symbol === 'USDT' || coin.symbol === 'USDC' ? 2 : 4) : '••••'}
                  </span>
                  <span className="text-[10px] text-muted md:hidden ml-1">Available</span>
                </div>

                {/* Locked */}
                <div className="text-right">
                  <span className="text-xs font-mono text-muted block md:inline">
                    {balanceVisible ? (coin.locked + coin.inOrder).toFixed(4) : '••••'}
                  </span>
                  <span className="text-[10px] text-muted md:hidden ml-1">Locked</span>
                </div>

                {/* USD Value */}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-primary dark:text-white">
                    {balanceVisible ? formatCurrency(coin.usdValue, 'USD') : '••••••'}
                  </span>
                </div>

                {/* Actions */}
                <div className="text-right flex items-center justify-end gap-1.5 col-span-2 md:col-span-1 mt-1 md:mt-0">
                  <button
                    onClick={() => openDepositModal(coin)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => { setActiveTab('withdraw'); setWithdrawCoin(coin.symbol); setWithdrawNetworkId(coin.networks[0]?.id || ''); }}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-muted hover:text-primary dark:hover:text-white hover:bg-surface-alt border border-default transition-all cursor-pointer"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────── TAB: Deposit ──────── */}
      {activeTab === 'deposit' && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl p-6">
          <h3 className="text-base font-bold text-primary dark:text-white mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-cyan-400" />
            Select Coin to Deposit
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {summary?.coins.map(coin => (
              <button
                key={coin.id}
                onClick={() => openDepositModal(coin)}
                className="flex flex-col items-center p-4 rounded-2xl bg-surface-alt border border-default hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all cursor-pointer group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-extrabold font-mono border mb-2 group-hover:scale-110 transition-transform shadow-md"
                  style={{
                    background: `${coin.iconColor}15`,
                    borderColor: `${coin.iconColor}30`,
                    color: coin.iconColor,
                  }}
                >
                  {coin.symbol.slice(0, 3)}
                </div>
                <span className="text-xs font-bold text-primary dark:text-white">{coin.symbol}</span>
                <span className="text-[10px] text-muted">{coin.networks.length} network{coin.networks.length > 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──────── TAB: Withdraw ──────── */}
      {activeTab === 'withdraw' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-subtle flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-cyan-400" />
              <span className="text-base font-bold text-primary dark:text-white">
                {withdrawStep === 'form' ? 'Withdraw Crypto' : 'Confirm Withdrawal'}
              </span>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="p-5 space-y-4">
              {withdrawStep === 'form' ? (
                <>
                  {/* Coin Select */}
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Coin</label>
                    <select
                      value={withdrawCoin}
                      onChange={(e) => {
                        setWithdrawCoin(e.target.value);
                        const coin = summary?.coins.find(c => c.symbol === e.target.value);
                        if (coin) setWithdrawNetworkId(coin.networks.find(n => n.isDefault)?.id || coin.networks[0]?.id || '');
                      }}
                      className="w-full p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-bold text-primary dark:text-white outline-hidden cursor-pointer focus:border-cyan-500/50"
                    >
                      <option value="">Select coin...</option>
                      {summary?.coins.map(c => (
                        <option key={c.id} value={c.symbol}>
                          {c.symbol} — {c.name} (Available: {c.available})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Network Select */}
                  {selectedWithdrawCoin && (
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Network</label>
                      <select
                        value={withdrawNetworkId}
                        onChange={(e) => setWithdrawNetworkId(e.target.value)}
                        className="w-full p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-bold text-primary dark:text-white outline-hidden cursor-pointer focus:border-cyan-500/50"
                      >
                        {selectedWithdrawCoin.networks.map(n => (
                          <option key={n.id} value={n.id}>
                            {n.name} — Fee: {n.withdrawFee} {selectedWithdrawCoin.symbol} • Min: {n.minWithdraw}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Address */}
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Withdrawal Address</label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="Enter wallet address..."
                      className="w-full p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-mono text-primary dark:text-white placeholder:text-muted outline-hidden focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Amount</label>
                      {selectedWithdrawCoin && (
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(selectedWithdrawCoin.available.toString())}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          Max: {selectedWithdrawCoin.available} {selectedWithdrawCoin.symbol}
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-mono font-bold text-primary dark:text-white placeholder:text-muted outline-hidden focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Fee Summary */}
                  {selectedWithdrawNetwork && parseFloat(withdrawAmount) > 0 && (
                    <div className="p-3 bg-surface-alt rounded-xl border border-default space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Network Fee</span>
                        <span className="font-mono font-bold text-primary dark:text-white">{withdrawalFee} {withdrawCoin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">You Receive</span>
                        <span className="font-mono font-bold text-emerald-400">{Math.max(0, withdrawalNet).toFixed(4)} {withdrawCoin}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted">Est. Arrival</span>
                        <span className="text-muted">{selectedWithdrawNetwork.estimatedTime}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
                  >
                    Review Withdrawal
                  </button>
                </>
              ) : (
                /* Confirmation Step */
                <>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200">
                      <p className="font-bold mb-1">Double-check all details</p>
                      <p>Cryptocurrency transactions are irreversible. Sending to the wrong address will result in permanent loss of funds.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Coin', value: `${withdrawCoin} (${selectedWithdrawNetwork?.shortName || ''})` },
                      { label: 'Network', value: selectedWithdrawNetwork?.name || '' },
                      { label: 'To Address', value: truncateAddress(withdrawAddress, 12, 8), full: withdrawAddress },
                      { label: 'Amount', value: `${withdrawAmount} ${withdrawCoin}` },
                      { label: 'Fee', value: `${withdrawalFee} ${withdrawCoin}` },
                      { label: 'You Receive', value: `${Math.max(0, withdrawalNet).toFixed(4)} ${withdrawCoin}`, highlight: true },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between px-3 py-2 bg-surface-alt rounded-xl border border-default">
                        <span className="text-xs text-muted">{item.label}</span>
                        <span className={`text-xs font-mono font-bold ${item.highlight ? 'text-emerald-400' : 'text-primary dark:text-white'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWithdrawStep('form')}
                      className="flex-1 py-3 bg-surface-alt text-primary dark:text-white font-bold text-xs rounded-xl border border-default transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={withdrawSubmitting}
                      className="flex-1 py-3 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
                    >
                      {withdrawSubmitting ? 'Submitting...' : 'Confirm & Withdraw'}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Protected by MPC multi-signature authorization
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ──────── TAB: Deposit History ──────── */}
      {activeTab === 'deposit-history' && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-subtle flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-primary dark:text-white">Deposit History</span>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-7 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-subtle bg-surface-alt/50">
            <span>Coin</span>
            <span>Network</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span>Confirmations</span>
            <span>Tx Hash</span>
            <span className="text-right">Time</span>
          </div>

          <div className="divide-y divide-subtle">
            {deposits.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">No deposit history</div>
            ) : deposits.map(dep => (
              <div key={dep.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-0 px-4 py-3 hover:bg-surface-alt/50 transition-colors items-center text-xs">
                <span className="font-bold text-primary dark:text-white">{dep.coin}</span>
                <span className="text-muted text-[11px]">{dep.network}</span>
                <span className="text-right font-mono font-bold text-emerald-400 md:text-primary md:dark:text-white">
                  +{dep.amount} {dep.coin}
                </span>
                <div><StatusBadge status={dep.status} size="sm" /></div>
                <span className="text-muted font-mono">
                  {dep.confirmations}/{dep.requiredConfirmations}
                  {dep.status === 'pending' || dep.status === 'processing' ? (
                    <span className="ml-1 inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  ) : null}
                </span>
                <span className="font-mono text-[10px]">
                  {dep.txHash ? (
                    <a
                      href={getExplorerUrl(dep.coin, dep.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {truncateAddress(dep.txHash, 8, 6)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </span>
                <span className="text-right text-muted text-[11px]">{formatDate(dep.createdAt, 'datetime')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────── TAB: Withdrawal History ──────── */}
      {activeTab === 'withdrawal-history' && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-subtle flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-primary dark:text-white">Withdrawal History</span>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-7 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-subtle bg-surface-alt/50">
            <span>Coin</span>
            <span>To Address</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Fee</span>
            <span>Status</span>
            <span>Tx Hash</span>
            <span className="text-right">Time</span>
          </div>

          <div className="divide-y divide-subtle">
            {withdrawals.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">No withdrawal history</div>
            ) : withdrawals.map(w => (
              <div key={w.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-0 px-4 py-3 hover:bg-surface-alt/50 transition-colors items-center text-xs">
                <div>
                  <span className="font-bold text-primary dark:text-white">{w.coin}</span>
                  <span className="text-[10px] text-muted block">{w.network}</span>
                </div>
                <span className="font-mono text-[10px] text-muted">{truncateAddress(w.toAddress, 8, 6)}</span>
                <span className="text-right font-mono font-bold text-rose-400">-{w.amount}</span>
                <span className="text-right font-mono text-muted">{w.fee}</span>
                <div>
                  <StatusBadge status={w.status} size="sm" />
                  {w.rejectionReason && (
                    <p className="text-[10px] text-rose-400 mt-0.5 max-w-[150px] truncate" title={w.rejectionReason}>
                      {w.rejectionReason}
                    </p>
                  )}
                </div>
                <span className="font-mono text-[10px]">
                  {w.txHash ? (
                    <a
                      href={getExplorerUrl(w.coin, w.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {truncateAddress(w.txHash, 8, 6)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-muted">Pending...</span>
                  )}
                </span>
                <span className="text-right text-muted text-[11px]">{formatDate(w.createdAt, 'datetime')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────── Deposit Address Modal ──────── */}
      {showDepositModal && depositCoin && depositNetwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md">
          <div className="bg-surface border border-default rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-subtle">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary dark:text-white text-base">Deposit {depositCoin.symbol}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {depositNetwork.shortName}
                </span>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-muted hover:text-primary dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Network Selector */}
            {depositCoin.networks.length > 1 && (
              <div className="mb-4">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Select Network</label>
                <div className="flex gap-2">
                  {depositCoin.networks.map(net => (
                    <button
                      key={net.id}
                      onClick={() => setDepositNetwork(net)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        depositNetwork.id === net.id
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          : 'bg-surface-alt text-muted border border-default hover:border-cyan-500/20'
                      }`}
                    >
                      {net.shortName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-2xl border-2 border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <QRCodeSVG data={depositNetwork.address} size={160} />
              </div>
            </div>

            {/* Address */}
            <div className="bg-surface-alt p-3 rounded-xl border border-default text-xs mb-3">
              <span className="text-[10px] text-muted uppercase font-bold block mb-1">
                {depositCoin.symbol} Deposit Address ({depositNetwork.shortName})
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-primary dark:text-white break-all text-[11px]">
                  {depositNetwork.address}
                </span>
                <button
                  onClick={() => handleCopy(depositNetwork.address, `${depositCoin.symbol} address copied`)}
                  className="p-2 bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 rounded-lg hover:from-cyan-300 hover:to-indigo-500 shrink-0 cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                >
                  {copied === depositNetwork.address ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Memo if applicable */}
            {depositNetwork.memo && (
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-xs mb-3">
                <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
                  Memo / Tag (Required)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-primary dark:text-white">{depositNetwork.memo}</span>
                  <button
                    onClick={() => handleCopy(depositNetwork.memo!, 'Memo copied')}
                    className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 cursor-pointer"
                  >
                    {copied === depositNetwork.memo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-muted">
                <span>Min. Deposit</span>
                <span className="font-mono font-bold text-primary dark:text-white">{depositNetwork.minDeposit} {depositCoin.symbol}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Confirmations</span>
                <span className="font-mono font-bold text-primary dark:text-white">{depositNetwork.confirmations}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Est. Arrival</span>
                <span className="font-mono font-bold text-cyan-400">{depositNetwork.estimatedTime}</span>
              </div>
            </div>

            <p className="text-[10px] text-muted mt-3 text-center">
              Send only <strong className="text-cyan-400">{depositCoin.symbol}</strong> on the <strong className="text-cyan-400">{depositNetwork.name}</strong> network.
              Sending other assets may result in permanent loss.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
