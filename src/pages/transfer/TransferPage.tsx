import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TradingAccount } from '../../types';
import { accountService } from '../../services/mock/accountService';
import { transactionService } from '../../services/mock/transactionService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export const TransferPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const accs = await accountService.getAccounts('real');
      setAccounts(accs);

      const fromParam = searchParams.get('from');
      if (fromParam && accs.some(a => a.id === fromParam)) {
        setFromAccountId(fromParam);
        const other = accs.find(a => a.id !== fromParam);
        if (other) setToAccountId(other.id);
      } else if (accs.length >= 2) {
        setFromAccountId(accs[0].id);
        setToAccountId(accs[1].id);
      } else if (accs.length === 1) {
        setFromAccountId(accs[0].id);
      }
      setLoading(false);
    };
    init();
  }, [searchParams]);

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  const handleSwapAccounts = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !toAccount) return;

    if (fromAccountId === toAccountId) {
      showToast('error', 'Invalid Selection', 'Source and destination accounts must be different.');
      return;
    }

    if (amount > fromAccount.freeMargin) {
      showToast('error', 'Insufficient Free Margin', `Maximum transferrable from #${fromAccount.accountNumber} is $${fromAccount.freeMargin.toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      // Execute simulated transfer
      const tx = await transactionService.createTransaction({
        type: 'transfer',
        amount,
        currency: 'USD',
        status: 'completed',
        method: 'Internal Transfer',
        accountNumber: fromAccount.accountNumber,
        reference: `TRF-${Date.now().toString().slice(-8)}`,
        notes: `Transfer from #${fromAccount.accountNumber} to #${toAccount.accountNumber}`,
      });

      // Update balances in service
      await accountService.updateAccount(fromAccount.id, {
        balance: +(fromAccount.balance - amount).toFixed(2),
        equity: +(fromAccount.equity - amount).toFixed(2),
        freeMargin: +(fromAccount.freeMargin - amount).toFixed(2),
      });

      await accountService.updateAccount(toAccount.id, {
        balance: +(toAccount.balance + amount).toFixed(2),
        equity: +(toAccount.equity + amount).toFixed(2),
        freeMargin: +(toAccount.freeMargin + amount).toFixed(2),
      });

      setTransferSuccess(tx);
      showToast('success', 'Internal Transfer Instant', `Transferred $${amount} from #${fromAccount.accountNumber} to #${toAccount.accountNumber}`);
    } catch (err: any) {
      showToast('error', 'Transfer Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
          <span>Internal Fund Transfer</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Move funds instantly between your trading accounts • 0% Commission
        </p>
      </div>

      {transferSuccess ? (
        <div className="bg-surface-alt backdrop-blur-xl border border-subtle rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-primary dark:text-white">
              Transfer Completed Instantly!
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Balances have been synchronized in real-time across both accounts.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-overlay border border-subtle rounded-2xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Reference:</span>
              <strong className="font-mono text-cyan-400">{transferSuccess.reference}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Amount Transferred:</span>
              <strong className="font-mono text-emerald-400 font-bold text-sm">${amount.toFixed(2)} USD</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">From Account:</span>
              <strong className="text-primary dark:text-white font-mono">#{fromAccount?.accountNumber}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">To Account:</span>
              <strong className="text-primary dark:text-white font-mono">#{toAccount?.accountNumber}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setTransferSuccess(null);
                setAmount(100);
              }}
              className="px-5 py-2.5 rounded-xl bg-surface-alt border border-default text-primary dark:text-white text-xs font-bold hover:bg-surface-alt cursor-pointer"
            >
              New Transfer
            </button>
            <button
              onClick={() => navigate('/accounts')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer"
            >
              View Accounts
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleTransferSubmit} className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
            
            {/* From Account */}
            <div className="md:col-span-3 space-y-2">
              <label className="block text-xs font-bold text-secondary">
                From Account (Source)
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>
                    #{acc.accountNumber} ({acc.nickname}) - ${acc.freeMargin.toFixed(2)}
                  </option>
                ))}
              </select>
              {fromAccount && (
                <p className="text-[11px] text-muted">
                  Free Margin: <strong className="text-emerald-400 font-mono">${fromAccount.freeMargin.toFixed(2)}</strong>
                </p>
              )}
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pt-2">
              <button
                type="button"
                onClick={handleSwapAccounts}
                className="w-10 h-10 rounded-xl bg-surface-alt hover:bg-surface-alt border border-default text-cyan-400 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(34,211,238,0.15)] cursor-pointer"
                title="Swap accounts"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* To Account */}
            <div className="md:col-span-3 space-y-2">
              <label className="block text-xs font-bold text-secondary">
                To Account (Destination)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                    #{acc.accountNumber} ({acc.nickname}) - ${acc.balance.toFixed(2)}
                  </option>
                ))}
              </select>
              {toAccount && (
                <p className="text-[11px] text-muted">
                  Current Balance: <strong className="text-primary dark:text-white font-mono">${toAccount.balance.toFixed(2)}</strong>
                </p>
              )}
            </div>

          </div>

          {/* Transfer Amount */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-secondary">
              Transfer Amount ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-lg text-muted">
                $
              </span>
              <input
                type="number"
                min={1}
                max={fromAccount?.freeMargin || 10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-9 pr-20 py-3 rounded-xl bg-surface-alt border border-default text-xl font-extrabold font-mono text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(fromAccount?.freeMargin || 0)}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-[10px] font-bold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Execution details */}
          <div className="p-3.5 rounded-xl bg-surface-alt border border-subtle text-xs space-y-1 text-muted">
            <div className="flex justify-between">
              <span>Conversion Rate:</span>
              <strong className="text-primary dark:text-white">1.00 USD = 1.00 USD (0% Spread)</strong>
            </div>
            <div className="flex justify-between">
              <span>Commission:</span>
              <strong className="text-emerald-400 font-bold">FREE ($0.00)</strong>
            </div>
            <div className="flex justify-between">
              <span>Processing:</span>
              <strong className="text-cyan-400 font-bold">Instant Real-Time</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing || !fromAccount || !toAccount || fromAccountId === toAccountId}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <span>Synchronizing Ledger...</span>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                <span>Execute Transfer of ${amount.toFixed(2)} USD</span>
              </>
            )}
          </button>

        </form>
      )}

    </div>
  );
};
