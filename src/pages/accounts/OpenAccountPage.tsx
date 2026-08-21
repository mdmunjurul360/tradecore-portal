import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountType, PlatformType, Leverage } from '../../types';
import { ACCOUNT_TYPES_INFO } from '../../config/currencies';
import { accountService } from '../../services/mock/accountService';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Server,
  Layers,
  KeyRound,
  Copy,
  ChevronRight,
  Sliders
} from 'lucide-react';

export const OpenAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [accountStatus, setAccountStatus] = useState<'real' | 'demo'>('real');
  const [accountType, setAccountType] = useState<AccountType>('pro');
  const [platform, setPlatform] = useState<PlatformType>('MT5');
  const [currency, setCurrency] = useState<string>('USD');
  const [leverage, setLeverage] = useState<Leverage>('1:500');
  const [nickname, setNickname] = useState<string>('');
  const [initialDeposit, setInitialDeposit] = useState<number>(10000);
  const [tradingPassword, setTradingPassword] = useState<string>('Tr@deCore2026!');

  const [createdAccount, setCreatedAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const newAcc = await accountService.createAccount({
        type: accountType,
        status: accountStatus,
        platform,
        currency,
        leverage,
        nickname: nickname.trim() || `${accountType.toUpperCase()} ${platform}`,
        initialDeposit: accountStatus === 'demo' ? initialDeposit : 0,
      });

      setCreatedAccount(newAcc);
      setStep(5); // Success step
      showToast('success', 'Trading Account Created', `Account #${newAcc.accountNumber} is ready for trading.`);
    } catch (err: any) {
      showToast('error', 'Account Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary dark:text-white flex items-center justify-center gap-2">
          <span>Open New Trading Account</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Instant execution • Direct liquidity • Multi-asset instruments
        </p>
      </div>

      {/* Progress Bar Steps (1 to 4) */}
      {step < 5 && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span className={step >= 1 ? 'text-cyan-400' : ''}>1. Account Environment</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className={step >= 2 ? 'text-cyan-400' : ''}>2. Account Type</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className={step >= 3 ? 'text-cyan-400' : ''}>3. Platform</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className={step >= 4 ? 'text-cyan-400' : ''}>4. Parameters</span>
          </div>
          <div className="w-full bg-surface-alt h-1.5 rounded-full mt-3 overflow-hidden border border-subtle">
            <div
              className="bg-gradient-to-r from-cyan-400 to-indigo-600 h-full transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Real vs Demo */}
      {step === 1 && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
            <span>Select Account Mode</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setAccountStatus('real')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                accountStatus === 'real'
                  ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                  : 'border-subtle bg-surface-alt hover:border-default'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                  $
                </div>
                {accountStatus === 'real' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
              </div>
              <h3 className="text-base font-bold text-primary dark:text-white">Real Trading Account</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Trade on live global markets with real funds, instant automated deposits, and ultra-fast withdrawals.
              </p>
            </div>

            <div
              onClick={() => setAccountStatus('demo')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                accountStatus === 'demo'
                  ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                  : 'border-subtle bg-surface-alt hover:border-default'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                  🧪
                </div>
                {accountStatus === 'demo' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
              </div>
              <h3 className="text-base font-bold text-primary dark:text-white">Demo Trading Account</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Practice strategies with virtual balance in real-time interbank market conditions with zero risk.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-subtle">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
            >
              <span>Next: Select Account Type</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Account Type */}
      {step === 2 && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
              <span>Choose Account Specifications</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Select the spread structure and commission profile tailored to your trading style.
            </p>
          </div>

          <div className="space-y-3">
            {(Object.keys(ACCOUNT_TYPES_INFO) as AccountType[]).map((typeKey) => {
              const info = ACCOUNT_TYPES_INFO[typeKey];
              const isSelected = accountType === typeKey;

              return (
                <div
                  key={typeKey}
                  onClick={() => setAccountType(typeKey)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                      : 'border-subtle bg-surface-alt hover:border-default'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-primary dark:text-white">{info.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {info.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{info.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-right font-mono text-xs shrink-0">
                    <div>
                      <span className="text-[10px] text-muted block font-sans">Spread</span>
                      <strong className="text-primary dark:text-white">{info.spread}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block font-sans">Commission</span>
                      <strong className="text-primary dark:text-white">{info.commission}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block font-sans">Min Deposit</span>
                      <strong className="text-cyan-400">${info.minDeposit}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-subtle">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted hover:text-primary dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
            >
              <span>Next: Trading Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Platform */}
      {step === 3 && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
            <span>Choose Trading Terminal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'MT5', name: 'MetaTrader 5 (MT5)', desc: 'Next-gen multi-asset platform with advanced indicators and algorithmic EA backtesting.' },
              { id: 'WebTerminal', name: 'TradeCore Web Terminal', desc: 'Instant browser charting, 1-click execution, no installation required.' },
              { id: 'MT4', name: 'MetaTrader 4 (MT4)', desc: 'World most popular forex terminal for classic algorithmic trading and expert advisors.' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setPlatform(p.id as PlatformType)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  platform === p.id
                    ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                    : 'border-subtle bg-surface-alt hover:border-default'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-surface-alt text-primary dark:text-white">
                      {p.id}
                    </span>
                    {platform === p.id && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <h4 className="text-sm font-bold text-primary dark:text-white">{p.name}</h4>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-subtle">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted hover:text-primary dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
            >
              <span>Next: Account Parameters</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Settings & Review */}
      {step === 4 && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
            <span>Configure Account Parameters</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="USDT">USDT - Tether USD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                Maximum Leverage
              </label>
              <select
                value={leverage}
                onChange={(e) => setLeverage(e.target.value as Leverage)}
                className="w-full p-2.5 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
              >
                <option value="1:200">1:200 (Standard)</option>
                <option value="1:500">1:500 (Pro Trader)</option>
                <option value="1:1000">1:1000 (High)</option>
                <option value="1:2000">1:2000 (Ultra)</option>
                <option value="1:Unlimited">1:Unlimited (Dynamic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                Account Nickname (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Scalper MT5 Main"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white placeholder-slate-400 outline-hidden focus:border-cyan-500/50"
              />
            </div>

            {accountStatus === 'demo' ? (
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Virtual Starting Balance
                </label>
                <select
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-surface border border-default text-xs font-bold text-primary dark:text-white outline-hidden cursor-pointer"
                >
                  <option value={1000}>$1,000.00 USD</option>
                  <option value={5000}>$5,000.00 USD</option>
                  <option value={10000}>$10,000.00 USD</option>
                  <option value={50000}>$50,000.00 USD</option>
                  <option value={100000}>$100,000.00 USD</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Trading Password
                </label>
                <input
                  type="password"
                  value={tradingPassword}
                  onChange={(e) => setTradingPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white outline-hidden font-mono focus:border-cyan-500/50"
                />
              </div>
            )}

          </div>

          {/* Review Summary */}
          <div className="p-4 rounded-xl bg-surface-alt border border-subtle text-xs space-y-1.5">
            <p className="font-bold text-primary dark:text-white">Summary Review:</p>
            <p className="text-muted">
              Creating a <strong className="text-cyan-400 uppercase">{accountStatus} {accountType}</strong> account on <strong className="text-primary dark:text-white">{platform}</strong> with leverage <strong className="text-primary dark:text-white">{leverage}</strong> in {currency}.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-subtle">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted hover:text-primary dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
            >
              <span>{loading ? 'Provisioning Account...' : 'Open Account Now'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success & Credentials Screen */}
      {step === 5 && createdAccount && (
        <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-primary dark:text-white">
              Account Created Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Your new trading account has been provisioned and is ready for trading.
            </p>
          </div>

          {/* Account Credentials Box */}
          <div className="max-w-md mx-auto bg-surface-alt border border-default rounded-2xl p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Account Number / Login:</span>
              <strong className="font-mono text-cyan-400 font-bold">#{createdAccount.accountNumber}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Trading Server:</span>
              <strong className="font-mono text-primary dark:text-white">{createdAccount.server}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Platform:</span>
              <strong className="text-primary dark:text-white">{createdAccount.platform}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Leverage:</span>
              <strong className="text-primary dark:text-white">{createdAccount.leverage}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Starting Balance:</span>
              <strong className="text-emerald-400 font-mono font-bold">${createdAccount.balance.toFixed(2)} USD</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/accounts')}
              className="px-6 py-2.5 rounded-xl bg-surface-alt hover:bg-surface-alt border border-default text-primary dark:text-white font-bold text-xs transition-all cursor-pointer"
            >
              Go to My Accounts
            </button>
            {accountStatus === 'real' && (
              <button
                onClick={() => navigate(`/deposit?account=${createdAccount.id}`)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all cursor-pointer active:scale-98"
              >
                Deposit Funds to Account
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
