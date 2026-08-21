import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TradingAccount, PaymentMethod } from '../../types';
import { accountService } from '../../services/mock/accountService';
import { paymentService } from '../../services/mock/paymentService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  ArrowDownToLine,
  CreditCard,
  QrCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  Info
} from 'lucide-react';

export const DepositPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [amount, setAmount] = useState<number>(500);
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [accs, methods] = await Promise.all([
        accountService.getAccounts('real'),
        paymentService.getPaymentMethods('deposit')
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

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !selectedMethod) return;

    if (amount < selectedMethod.minAmount) {
      showToast('error', 'Amount too low', `Minimum deposit is $${selectedMethod.minAmount}`);
      return;
    }
    if (amount > selectedMethod.maxAmount) {
      showToast('error', 'Amount too high', `Maximum deposit is $${selectedMethod.maxAmount}`);
      return;
    }

    setProcessing(true);
    try {
      const res = await paymentService.processDeposit({
        accountId: selectedAccount.id,
        methodId: selectedMethod.id,
        amount,
        currency,
      });
      setDepositSuccess(res);
      showToast('success', 'Deposit Approved & Credited', `$${amount} credited to account #${selectedAccount.accountNumber}`);
    } catch (err: any) {
      showToast('error', 'Deposit Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
          <span>Deposit Trading Capital</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Zero deposit fees • Instant automatic account crediting • Segregated Tier-1 banks
        </p>
      </div>

      {depositSuccess ? (
        /* Deposit Receipt */
        <div className="bg-surface-alt backdrop-blur-xl border border-subtle rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-primary dark:text-white">
              Deposit Successfully Processed!
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Your trading account has been credited with funds.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-overlay border border-subtle rounded-2xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Transaction Reference:</span>
              <strong className="font-mono text-cyan-400">{depositSuccess.transaction.reference}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Target Account:</span>
              <strong className="text-primary dark:text-white font-mono">#{depositSuccess.transaction.accountNumber}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Amount Credited:</span>
              <strong className="font-mono text-emerald-400 font-bold text-sm">${depositSuccess.transaction.amount.toFixed(2)} USD</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Status:</span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {depositSuccess.transaction.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setDepositSuccess(null);
                setAmount(500);
              }}
              className="px-5 py-2.5 rounded-xl bg-surface-alt border border-default text-primary dark:text-white text-xs font-bold hover:bg-surface-alt cursor-pointer"
            >
              Make Another Deposit
            </button>
            <button
              onClick={() => navigate('/accounts')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer"
            >
              Go to Trading Accounts
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleDepositSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Account Selection + Payment Methods + Amount */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Destination Account */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-3">
              <label className="block text-xs font-bold text-secondary">
                1. Select Destination Trading Account
              </label>

              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    #{acc.accountNumber} - {acc.nickname} ({acc.type.toUpperCase()} • Balance: ${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>

              {selectedAccount && (
                <div className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-surface-alt border border-subtle text-secondary font-medium">
                  <span>Current Balance: <strong className="text-primary dark:text-white font-mono">${selectedAccount.balance.toFixed(2)}</strong></span>
                  <span>Leverage: <strong className="text-cyan-400 font-mono">{selectedAccount.leverage}</strong></span>
                  <span>Server: <strong className="text-primary dark:text-white">{selectedAccount.server}</strong></span>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-3">
              <label className="block text-xs font-bold text-secondary">
                2. Choose Payment Method
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
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-primary dark:text-white truncate">
                            {method.name}
                          </p>
                          {method.popular && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 uppercase">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">
                          {method.processingTime} • Fee: {method.fee === 0 ? '0%' : `${method.fee}%`}
                        </p>
                        <p className="text-[10px] text-muted font-mono mt-0.5">
                          Limits: ${method.minAmount} - ${method.maxAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Amount Input & Presets */}
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-3">
              <label className="block text-xs font-bold text-secondary">
                3. Deposit Amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-lg text-muted">
                  $
                </span>
                <input
                  type="number"
                  min={selectedMethod?.minAmount || 10}
                  max={selectedMethod?.maxAmount || 50000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-20 py-3 rounded-xl bg-surface-alt border border-default text-xl font-extrabold font-mono text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                  USD
                </span>
              </div>

              {/* Quick Amount Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[100, 250, 500, 1000, 2500, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                      amount === val
                        ? 'bg-gradient-to-r from-cyan-400 to-indigo-600 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                        : 'bg-surface-alt border border-subtle text-secondary hover:bg-surface-alt'
                    }`}
                  >
                    +${val}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right 1 Col: Summary & Confirmation Card */}
          <div className="space-y-4">
            <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-5 shadow-2xl space-y-4 sticky top-20">
              <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
                <span>Deposit Summary</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-muted">Destination:</span>
                  <span className="font-bold text-primary dark:text-white font-mono">#{selectedAccount?.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-muted">Payment Channel:</span>
                  <span className="font-bold text-primary dark:text-white">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-muted">Deposit Fee:</span>
                  <span className="font-bold text-emerald-400 font-mono">0.00 USD (Free)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-muted">Execution Speed:</span>
                  <span className="font-bold text-cyan-400">{selectedMethod?.processingTime}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold border-t border-subtle">
                  <span className="text-primary dark:text-white">Amount to Credit:</span>
                  <span className="font-mono text-emerald-400 text-base">${amount.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-alt border border-subtle text-[11px] text-muted space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-secondary">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Regulated Client Security
                </div>
                <p>Funds are instantly locked in segregated client accounts under tier-1 custodian vaults.</p>
              </div>

              <button
                type="submit"
                disabled={processing || !selectedAccount || !selectedMethod}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <span>Processing Payment Gateway...</span>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
                    <span>Deposit ${amount.toFixed(2)} USD</span>
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
