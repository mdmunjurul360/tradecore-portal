import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/mock/authService';
import { UserSession } from '../../types';
import {
  User,
  ShieldCheck,
  KeyRound,
  Sliders,
  Bell,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Server,
  Lock,
  Globe,
  Trash2,
  Zap,
  Copy
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, switchUserRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') || 'profile') as 'profile' | 'verification' | 'security' | 'trading' | 'notifications';

  // Profile fields state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'United Kingdom');
  const [address, setAddress] = useState(user?.address || '1 Canada Square, Canary Wharf');
  const [city, setCity] = useState(user?.city || 'London');
  const [postalCode, setPostalCode] = useState(user?.postalCode || 'E14 5AA');

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sessions, setSessions] = useState<UserSession[]>([]);

  // Trading settings
  const [oneClickTrading, setOneClickTrading] = useState(true);
  const [marginAlertLevel, setMarginAlertLevel] = useState(80);
  const [vpsAllocated, setVpsAllocated] = useState(true);

  // Notification toggles
  const [emailDeposit, setEmailDeposit] = useState(true);
  const [emailMarginCall, setEmailMarginCall] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(false);

  // KYC upload simulated states
  const [idFile, setIdFile] = useState<string | null>(null);
  const [proofAddressFile, setProofAddressFile] = useState<string | null>(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setCountry(user.country || 'United Kingdom');
      setAddress(user.address || '');
      setCity(user.city || '');
      setPostalCode(user.postalCode || '');
      setTwoFactorEnabled(user.twoFactorEnabled || false);
    }
    const loadSessions = async () => {
      const s = await authService.getActiveSessions();
      setSessions(s);
    };
    loadSessions();
  }, [user]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        firstName,
        lastName,
        phone,
        country,
        address,
        city,
        postalCode,
      });
      showToast('success', 'Profile Updated', 'Personal information saved successfully.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('warning', 'Missing Fields', 'Please enter your current and new password.');
      return;
    }
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      showToast('success', 'Password Changed', 'Your security credentials have been updated.');
    } catch (err: any) {
      showToast('error', 'Password Error', err.message);
    }
  };

  const handleToggle2FA = async () => {
    const newState = !twoFactorEnabled;
    setTwoFactorEnabled(newState);
    await updateUser({ twoFactorEnabled: newState });
    showToast(newState ? 'success' : 'info', '2FA Status Changed', newState ? '2FA is now active via Authenticator app.' : '2FA has been disabled.');
  };

  const handleKycSubmit = () => {
    if (!idFile && !proofAddressFile) {
      showToast('warning', 'No Documents', 'Please choose files to upload.');
      return;
    }
    setUploadingKyc(true);
    setTimeout(() => {
      setUploadingKyc(false);
      switchUserRole('pending');
      showToast('success', 'Documents Submitted', 'KYC compliance team is reviewing your documents.');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white flex items-center gap-2">
            <span>Account & Security Settings</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Manage your personal profile, identity verification (KYC), security credentials, and EA infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border flex items-center gap-1.5 ${
            user?.kycStatus === 'verified'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : user?.kycStatus === 'pending'
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            <span>KYC: {user?.kycStatus?.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-subtle pb-3 overflow-x-auto">
        {[
          { id: 'profile', label: 'Personal Profile', icon: User },
          { id: 'verification', label: 'Identity Verification (KYC)', icon: ShieldCheck },
          { id: 'security', label: 'Security & 2FA', icon: KeyRound },
          { id: 'trading', label: 'Trading & VPS Preferences', icon: Sliders },
          { id: 'notifications', label: 'Alerts & Webhooks', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)] font-extrabold'
                  : 'bg-surface-alt border border-subtle text-muted hover:text-primary dark:hover:text-white hover:bg-surface-alt'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="max-w-3xl space-y-6">
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
              <span>Personal Details</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'alex.morgan@tradecore.io'}
                  className="w-full p-2.5 rounded-xl bg-surface border border-subtle text-xs text-muted font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white font-mono outline-hidden focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Country of Residence</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface border border-default text-xs text-primary dark:text-white outline-hidden cursor-pointer"
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Residential Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white outline-hidden focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-subtle">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer active:scale-98"
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Verification (KYC) */}
      {activeTab === 'verification' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
                  <span>KYC Compliance Status</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Full tier verification unlocks unlimited leverage, crypto withdrawals up to $500k/day, and institutional accounts.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-alt border border-default text-xs font-mono font-bold">
                <span className="capitalize text-cyan-400">{user?.kycStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Step 1: Proof of Identity */}
              <div className="p-4 rounded-xl border border-default bg-surface-alt space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary dark:text-white">1. Proof of Identity</span>
                  {user?.identityVerified ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Passport, Driving License, or National Identity Card (front and back in high resolution).
                </p>
                <div className="border border-dashed border-default rounded-xl p-4 text-center cursor-pointer hover:bg-surface-alt transition-colors">
                  <Upload className="w-6 h-6 text-muted mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-primary dark:text-white">Upload Identity Document</p>
                  <p className="text-[10px] text-muted mt-0.5">PNG, JPG, or PDF up to 15MB</p>
                  <input
                    type="file"
                    className="hidden"
                    id="id-doc-upload"
                    onChange={(e) => setIdFile(e.target.files?.[0]?.name || 'Passport_Scan.pdf')}
                  />
                  <label htmlFor="id-doc-upload" className="mt-2 inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded text-[11px] font-bold cursor-pointer">
                    {idFile || 'Select File'}
                  </label>
                </div>
              </div>

              {/* Step 2: Proof of Residence */}
              <div className="p-4 rounded-xl border border-default bg-surface-alt space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary dark:text-white">2. Proof of Residence</span>
                  {user?.addressVerified ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Utility bill, bank statement, or local council tax issued within the last 90 days.
                </p>
                <div className="border border-dashed border-default rounded-xl p-4 text-center cursor-pointer hover:bg-surface-alt transition-colors">
                  <Upload className="w-6 h-6 text-muted mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-primary dark:text-white">Upload Proof of Address</p>
                  <p className="text-[10px] text-muted mt-0.5">PNG, JPG, or PDF up to 15MB</p>
                  <input
                    type="file"
                    className="hidden"
                    id="address-doc-upload"
                    onChange={(e) => setProofAddressFile(e.target.files?.[0]?.name || 'Utility_Bill.pdf')}
                  />
                  <label htmlFor="address-doc-upload" className="mt-2 inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded text-[11px] font-bold cursor-pointer">
                    {proofAddressFile || 'Select File'}
                  </label>
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Quick Test:</span>
                <button
                  onClick={() => switchUserRole('verified')}
                  className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded font-bold hover:bg-emerald-500/30"
                >
                  Set Verified
                </button>
                <button
                  onClick={() => switchUserRole('unverified')}
                  className="text-[10px] px-2 py-1 bg-rose-500/20 text-rose-400 rounded font-bold hover:bg-rose-500/30"
                >
                  Set Unverified
                </button>
              </div>

              <button
                onClick={handleKycSubmit}
                disabled={uploadingKyc}
                className="px-6 py-2.5 bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer active:scale-98"
              >
                {uploadingKyc ? 'Uploading Documents...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Security & 2FA */}
      {activeTab === 'security' && (
        <div className="max-w-3xl space-y-6">
          {/* 2FA Setup */}
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
                  <span>Two-Factor Authentication (2FA)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Protect your trading capital with time-based OTP codes (Google Authenticator / Authy) required for withdrawals.
                </p>
              </div>
              <button
                onClick={handleToggle2FA}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  twoFactorEnabled
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : 'bg-surface-alt hover:bg-white/20 text-primary dark:text-white'
                }`}
              >
                {twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA'}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
              <span>Change Portal Password</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white font-mono outline-hidden focus:border-cyan-500/50"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-alt border border-default text-xs text-primary dark:text-white font-mono outline-hidden focus:border-cyan-500/50"
                  placeholder="At least 8 characters..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-surface-alt hover:bg-white/20 text-primary dark:text-white font-bold text-xs border border-default cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Active Sessions */}
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-primary dark:text-white">Active Login Sessions</h3>
            <div className="divide-y divide-subtle">
              {sessions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-primary dark:text-white flex items-center gap-2">
                      <span>{s.device} • {s.browser}</span>
                      {s.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.2 bg-cyan-500/20 text-cyan-300 rounded">
                          Current Session
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] font-mono text-muted mt-0.5">{s.ipAddress} • {s.location}</p>
                  </div>
                  {!s.isCurrent && (
                    <button
                      onClick={() => setSessions(sessions.filter(item => item.id !== s.id))}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold p-1"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Trading & VPS */}
      {activeTab === 'trading' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-6">
            <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
              <span>Trading Preferences & London VPS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h3>

            <div className="space-y-4">
              
              {/* VPS Box */}
              <div className="p-4 rounded-xl bg-surface-alt border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary dark:text-white">London Equinix LD4 Dedicated VPS</h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      0.38ms cross-connected latency to MT4/MT5 trade execution servers for 24/7 automated EAs.
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400 mt-1">Status: Running • IP 185.192.68.24</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setVpsAllocated(!vpsAllocated);
                    showToast('success', 'VPS Updated', 'VPS status updated.');
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-xs shrink-0 cursor-pointer"
                >
                  {vpsAllocated ? 'Restart VPS' : 'Claim Free VPS'}
                </button>
              </div>

              {/* 1-Click Trading */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-alt border border-subtle">
                <div>
                  <p className="text-xs font-bold text-primary dark:text-white">One-Click Trading Execution</p>
                  <p className="text-[11px] text-muted">Place and close orders directly from charts without secondary confirmation.</p>
                </div>
                <input
                  type="checkbox"
                  checked={oneClickTrading}
                  onChange={(e) => setOneClickTrading(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </div>

              {/* Margin Alert */}
              <div className="p-3 rounded-xl bg-surface-alt border border-subtle space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-primary dark:text-white">Margin Level Push Trigger</span>
                  <span className="font-mono text-cyan-400 font-bold">{marginAlertLevel}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={150}
                  step={5}
                  value={marginAlertLevel}
                  onChange={(e) => setMarginAlertLevel(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <p className="text-[10px] text-muted">Sends instant priority notification when margin level falls below this threshold.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Notifications */}
      {activeTab === 'notifications' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-surface backdrop-blur-xl border border-subtle rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
              <span>Notification Preferences</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Deposit & Withdrawal Confirmations', desc: 'Instant email receipts when funds are credited or withdrawn.', checked: emailDeposit, onChange: setEmailDeposit },
                { label: 'Margin Call & Stop Out Alerts', desc: 'Urgent notification when account equity approaches stop out levels.', checked: emailMarginCall, onChange: setEmailMarginCall },
                { label: 'Telegram Trading Bot Alerts', desc: 'Real-time order execution and TP/SL notifications on Telegram.', checked: telegramAlerts, onChange: setTelegramAlerts },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-alt border border-subtle">
                  <div>
                    <p className="text-xs font-bold text-primary dark:text-white">{item.label}</p>
                    <p className="text-[11px] text-muted">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-subtle">
              <button
                onClick={() => showToast('success', 'Preferences Saved', 'Notification settings updated.')}
                className="px-6 py-2.5 bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
