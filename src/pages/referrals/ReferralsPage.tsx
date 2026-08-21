import React, { useState, useEffect } from 'react';
import { ReferralData } from '../../types';
import { referralService } from '../../services/mock/referralService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Gift,
  Users,
  DollarSign,
  Copy,
  Check,
  Award,
  QrCode,
  Share2,
  ShieldCheck
} from 'lucide-react';

export const ReferralsPage: React.FC = () => {
  const { showToast } = useToast();

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await referralService.getReferralData();
      setData(res);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleCopyLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    showToast('info', 'Link Copied', 'Partner invitation link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-xs text-muted">Loading partner portal...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
          <span>Introducing Broker (IB) & Referral Portal</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Earn multi-tier volume rebates • Up to $15 per traded standard lot • Daily automated commission payouts
        </p>
      </div>

      {/* IB Partner Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-cyan-500/20 text-primary dark:text-white rounded-2xl p-6 sm:p-8 shadow-[0_0_25px_rgba(34,211,238,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            Tier Status: {data.tier} Partner
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-primary dark:text-white mt-1">
            {formatCurrency(data.totalEarned, 'USD')}
          </h2>
          <p className="text-xs text-muted mt-1">
            Lifetime Commission Paid • {data.totalReferred} active referred traders
          </p>
        </div>

        {/* 1-Click Referral Link Card */}
        <div className="bg-overlay p-4 rounded-xl border border-default max-w-md w-full shadow-lg">
          <label className="block text-[10px] uppercase font-bold text-muted mb-1">
            Your Dedicated Partner Tracking URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={data.referralLink}
              className="flex-1 bg-surface-alt border border-default rounded-lg px-3 py-1.5 text-xs text-primary dark:text-white font-mono outline-hidden"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 bg-gradient-to-br from-cyan-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.3)] cursor-pointer transition-all active:scale-98"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface backdrop-blur-xl border border-subtle shadow-2xl">
          <span className="text-xs font-bold text-muted uppercase">This Month Commission</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{formatCurrency(data.thisMonthEarned, 'USD')}</p>
        </div>
        <div className="p-5 rounded-2xl bg-surface backdrop-blur-xl border border-subtle shadow-2xl">
          <span className="text-xs font-bold text-muted uppercase">Traded Lots</span>
          <p className="text-2xl font-extrabold font-mono text-primary dark:text-white mt-1">428.50 Lots</p>
        </div>
        <div className="p-5 rounded-2xl bg-surface backdrop-blur-xl border border-subtle shadow-2xl">
          <span className="text-xs font-bold text-muted uppercase">Rebate Per Lot</span>
          <p className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">$12.00 / Lot</p>
        </div>
      </div>

      {/* Referred Clients Table */}
      <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-subtle">
          <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
            <span>Referred Client Registrations & Volume</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-overlay text-muted font-bold uppercase tracking-wider text-[10px] border-b border-subtle">
            <tr>
              <th className="p-4">Trader Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Registration Date</th>
              <th className="p-4">Traded Volume</th>
              <th className="p-4 text-right">Commission Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle text-secondary">
            {data.referrals.map(ref => (
              <tr key={ref.id} className="hover:bg-surface-alt transition-colors">
                <td className="p-4 font-bold text-primary dark:text-white">{ref.name}</td>
                <td className="p-4 font-mono text-muted">{ref.email}</td>
                <td className="p-4 text-muted">{formatDate(ref.registeredAt, 'short')}</td>
                <td className="p-4 font-mono text-cyan-400">{ref.volumeLots.toFixed(2)} Lots</td>
                <td className="p-4 text-right font-mono font-bold text-emerald-400">
                  +{formatCurrency(ref.commissionEarned, 'USD')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
