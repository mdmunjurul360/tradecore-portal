import React, { useState, useEffect } from 'react';
import { CryptoWallet, WalletBalance } from '../../types';
import { walletService } from '../../services/mock/walletService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Copy,
  QrCode,
  Check,
  ShieldCheck,
  Zap,
  TrendingUp,
  X
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { showToast } = useToast();

  const [wallet, setWallet] = useState<CryptoWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<WalletBalance | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const [swapFrom, setSwapFrom] = useState<string>('USDT');
  const [swapTo, setSwapTo] = useState<string>('BTC');
  const [swapAmount, setSwapAmount] = useState<number>(1000);
  const [swapProcessing, setSwapProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    const data = await walletService.getWallet();
    setWallet(data);
    if (data.balances.length > 0) {
      setSelectedAsset(data.balances[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwapProcessing(true);
    try {
      await walletService.swapCurrency(swapFrom, swapTo, swapAmount);
      await fetchWallet();
      setIsSwapModalOpen(false);
      showToast('success', 'Swap Executed', `Swapped ${swapAmount} ${swapFrom} to ${swapTo} successfully.`);
    } catch (err: any) {
      showToast('error', 'Swap Failed', err.message);
    } finally {
      setSwapProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <span>Crypto Vault & Multi-Currency Wallet</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Institutional non-custodial crypto storage • Instant spot swaps • Zero blockchain deposit fees
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-alt hover:bg-surface-alt border border-default text-primary dark:text-white font-bold text-xs transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            <span>Instant Swap</span>
          </button>
        </div>
      </div>

      {/* Wallet Total Valuation Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-cyan-500/20 text-primary dark:text-white rounded-2xl p-6 sm:p-8 shadow-[0_0_25px_rgba(34,211,238,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Total Vault Valuation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-primary dark:text-white mt-1">
            {wallet ? formatCurrency(wallet.totalUsdValue, 'USD') : '$0.00'}
          </h2>
          <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Protected by multi-signature MPC & insurance coverage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
            <span>Receive Crypto</span>
          </button>
          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-alt hover:bg-surface-alt text-primary dark:text-white font-bold text-xs border border-default transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            <span>Convert / Swap</span>
          </button>
        </div>
      </div>

      {/* Asset Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallet?.balances.map((asset) => (
          <div
            key={asset.currency}
            onClick={() => {
              setSelectedAsset(asset);
              setIsDepositModalOpen(true);
            }}
            className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 font-black flex items-center justify-center text-sm font-mono group-hover:scale-105 transition-transform shadow-[0_0_10px_rgba(34,211,238,0.15)]">
                  {asset.currency.slice(0, 3)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary dark:text-white">
                    {asset.currency}
                  </h4>
                  <span className="text-[10px] text-muted">{asset.network}</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <p className="text-sm font-bold text-primary dark:text-white">
                  {asset.amount.toFixed(asset.currency === 'USDT' || asset.currency === 'USDC' ? 2 : 4)}
                </p>
                <p className="text-xs text-muted">
                  ≈ {formatCurrency(asset.usdValue, 'USD')}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-cyan-400 font-bold">
              <span>View Address & Deposit</span>
              <QrCode className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Deposit / Receive QR Modal */}
      {isDepositModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md">
          <div className="bg-surface border border-default rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-subtle">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary dark:text-white text-base">Receive {selectedAsset.currency}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{selectedAsset.network}</span>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-muted hover:text-primary dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated QR Code */}
            <div className="w-48 h-48 bg-white p-3 rounded-2xl border-2 border-cyan-500/20 mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" fill="white" />
                {/* Simulated QR blocks */}
                <rect x="10" y="10" width="25" height="25" fill="#090d16" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="18" y="18" width="9" height="9" fill="#090d16" />

                <rect x="65" y="10" width="25" height="25" fill="#090d16" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="73" y="18" width="9" height="9" fill="#090d16" />

                <rect x="10" y="65" width="25" height="25" fill="#090d16" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="18" y="73" width="9" height="9" fill="#090d16" />

                {/* Random middle matrix blocks */}
                <rect x="40" y="15" width="8" height="8" fill="#090d16" />
                <rect x="42" y="30" width="15" height="8" fill="#090d16" />
                <rect x="30" y="45" width="20" height="10" fill="#090d16" />
                <rect x="55" y="45" width="15" height="15" fill="#090d16" />
                <rect x="40" y="70" width="18" height="18" fill="#090d16" />
                <rect x="70" y="70" width="15" height="15" fill="#090d16" />
              </svg>
            </div>

            <div className="bg-surface-alt p-3 rounded-xl border border-default text-left text-xs mb-4">
              <span className="text-[10px] text-muted uppercase font-bold block mb-1">
                Your Deposit Address ({selectedAsset.network})
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-primary dark:text-white break-all">
                  {selectedAsset.address}
                </span>
                <button
                  onClick={() => handleCopy(selectedAsset.address)}
                  className="p-2 bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 rounded-lg hover:from-cyan-300 hover:to-indigo-500 shrink-0 cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-muted">
              Send only <strong className="text-cyan-400">{selectedAsset.currency} ({selectedAsset.network})</strong> to this address. Credits are automatic after 1 blockchain confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md">
          <div className="bg-surface border border-default rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-subtle">
              <h3 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
                <span>Instant Crypto Spot Swap</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </h3>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="text-muted hover:text-primary dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSwap} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Pay with</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(Number(e.target.value))}
                    className="flex-1 p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-mono font-bold text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                  />
                  <select
                    value={swapFrom}
                    onChange={(e) => setSwapFrom(e.target.value)}
                    className="p-2.5 bg-surface border border-default rounded-xl text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
                  >
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">You Receive (Estimated)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    value={swapFrom === 'USDT' && swapTo === 'BTC' ? (swapAmount / 68400).toFixed(6) : (swapAmount * 1.00).toFixed(2)}
                    className="flex-1 p-2.5 bg-surface-alt border border-default rounded-xl text-sm font-mono font-bold text-emerald-400"
                  />
                  <select
                    value={swapTo}
                    onChange={(e) => setSwapTo(e.target.value)}
                    className="p-2.5 bg-surface border border-default rounded-xl text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
                  >
                    <option value="BTC">BTC</option>
                    <option value="USDT">USDT</option>
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-alt border border-subtle text-[11px] text-muted space-y-1">
                <div className="flex justify-between">
                  <span>Guaranteed Rate:</span>
                  <span className="font-mono font-bold text-primary dark:text-white">1 BTC ≈ 68,400.00 USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage:</span>
                  <span className="text-emerald-400 font-bold">0.00% (Instant MM Execution)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={swapProcessing}
                className="w-full py-3 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
              >
                {swapProcessing ? 'Swapping Liquidity...' : 'Execute Instant Swap'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
