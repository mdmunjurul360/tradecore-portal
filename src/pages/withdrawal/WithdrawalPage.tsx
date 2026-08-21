import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TradingAccount, PaymentMethod } from '../../types';
import { accountService } from '../../services/mock/accountService';
import { paymentService } from '../../services/mock/paymentService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  ArrowUpFromLine,
  CreditCard,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';

export const WithdrawalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [amount, setAmount] = useState<number>(200);
  const [destination, setDestination] = useState<string>('TXYZ9876543210AlphaTetherTRC20');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('849201');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [accs, methods] = await Promise.all([
        accountService.getAccounts('real'),
        paymentService.getPaymentMethods('withdrawal')
      ]);
      setAccounts(accs);
      setPaymentMethods(methods);

      const targetAcc = searchParams.get('account');
      if (targetAcc && accs.some(a => a.id === targetAcc)) {
        setSelectedAccountId(targetAcc);
      } else if (accs.length > 0) {
        setSelectedAccountId(accs[0].id);
      }

      if (methods.length > 0) {
        setSelectedMethodId(methods[0].id);
      }
      setLoading(false);
    };
    init();
  }, [searchParams]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !selectedMethod) return;

    if (amount > selectedAccount.freeMargin) {
      showToast('error', 'Insufficient Free Margin', `Maximum withdrawable is $${selectedAccount.freeMargin.toFixed(2)}`);
      return;
    }
    if (amount < selectedMethod.minAmount) {
      showToast('error', 'Amount below minimum', `Minimum withdrawal is $${selectedMethod.minAmount}`);
      return;
    }

    setProcessing(true);
    try {
      const res = await paymentService.processWithdrawal({
        accountId: selectedAccount.id,
        methodId: selectedMethod.id,
        amount,
        currency: 'USD',
        destination,
      });
      setWithdrawSuccess(res);
      showToast('success', 'Withdrawal Dispatched', `$${amount} sent to your ${selectedMethod.name}`);
    } catch (err: any) {
      showToast('error', 'Withdrawal Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
          <span>Withdraw Funds</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Automated 24/7 withdrawals • Direct crypto, bank, and card payout channels
        </p>
      </div>

      {withdrawSuccess ? (
        /* Withdrawal Success Receipt */
        <div className="bg-surface-alt backdrop-blur-xl border border-subtle rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-primary dark:text-white">
              Withdrawal Request Submitted!
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Funds have been deducted and dispatched to your destination.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-overlay border border-subtle rounded-2xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Reference Number:</span>
              <strong className="font-mono text-cyan-400">{withdrawSuccess.transaction.reference}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Source Account:</span>
              <strong className="text-primary dark:text-white font-mono">#{withdrawSuccess.transaction.accountNumber}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Payout Amount:</span>
              <strong className="font-mono text-rose-400 font-bold">-${withdrawSuccess.transaction.amount.toFixed(2)} USD</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Destination:</span>
              <strong className="font-mono text-primary dark:text-white truncate max-w-[200px]">{destination}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setWithdrawSuccess(null);
                setAmount(200);
              }}
              className="px-5 py-2.5 rounded-xl bg-surface-alt border border-default text-primary dark:text-white text-xs font-bold hover:bg-surface-alt cursor-pointer"
            >
              New Withdrawal
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer"
            >
              View Transaction History
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleWithdrawSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Account Source */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-3">
              <label className="block text-xs font-bold text-secondary">
                1. Select Source Trading Account
              </label>

              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    #{acc.accountNumber} - {acc.nickname} (Free Margin: ${acc.freeMargin.toFixed(2)})
                  </option>
                ))}
              </select>

              {selectedAccount && (
                <div className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-surface-alt border border-subtle text-secondary font-medium">
                  <span>Withdrawable Free Margin: <strong className="text-emerald-400 font-mono font-bold">${selectedAccount.freeMargin.toFixed(2)}</strong></span>
                  <span>Equity: <strong className="text-primary dark:text-white font-mono">${selectedAccount.equity.toFixed(2)}</strong></span>
                </div>
              )}
            </div>

            {/* Step 2: Withdrawal Method */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-3">
              <label className="block text-xs font-bold text-secondary">
                2. Choose Payout Method
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map(method => {
                  const isSelected = selectedMethodId === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethodId(method.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                          : 'border-subtle bg-surface-alt hover:bg-surface-alt hover:border-default'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 border ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-surface-alt text-muted border-subtle'
                      }`}>
                        {method.type === 'crypto' ? <QrCode className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-primary dark:text-white truncate">
                          {method.name}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">
                          Time: {method.processingTime}
                        </p>
                        <p className="text-[10px] text-muted font-mono mt-0.5">
                          Min: ${method.minAmount}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Amount & Destination */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  3. Withdrawal Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-lg text-muted">
                    $
                  </span>
                  <input
                    type="number"
                    min={selectedMethod?.minAmount || 10}
                    max={selectedAccount?.freeMargin || 50000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-20 py-3 rounded-xl bg-surface-alt border border-default text-xl font-extrabold font-mono text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(selectedAccount?.freeMargin || 0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-[10px] font-bold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Destination Address / Account / Card
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. TRC20 Wallet Address or IBAN"
                  className="w-full p-3 rounded-xl bg-surface-alt border border-default text-xs font-mono text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                  required
                />
              </div>

              {/* 2FA Security Code */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Two-Factor Authentication (2FA) Code
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="6-digit verification code"
                  className="w-full p-3 rounded-xl bg-surface-alt border border-default text-xs font-mono text-center tracking-widest text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>

          </div>

          {/* Right Summary Card */}
          <div className="space-y-4">
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-4 sticky top-20">
              <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
                <span>Withdrawal Summary</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-muted">Source:</span>
                  <span className="font-bold text-primary dark:text-white font-mono">#{selectedAccount?.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-muted">Payout Method:</span>
                  <span className="font-bold text-primary dark:text-white">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-muted">Withdrawal Fee:</span>
                  <span className="font-bold text-emerald-400 font-mono">0.00 USD</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold border-t border-subtle">
                  <span className="text-primary dark:text-white">Total Payout:</span>
                  <span className="font-mono text-rose-400 text-base">-${amount.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Anti-Money Laundering (AML)
                </div>
                <p>Withdrawals must match the name registered on your verified TradeCore profile.</p>
              </div>

              <button
                type="submit"
                disabled={processing || !selectedAccount || !selectedMethod}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <span>Verifying 2FA & Dispatching...</span>
                ) : (
                  <>
                    <ArrowUpFromLine className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm Withdrawal of ${amount.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  );
};
