'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, User as UserIcon, Wallet, Landmark, ShieldCheck, Gift, ShieldAlert } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { KycPill, StatusPill } from '@/components/admin/pills';
import { useAuthStore } from '@/store/useAuthStore';

export function UserDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  useEffect(() => {
    if (userId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [userId]);

  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState('');

  const { data: u, isLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminService.getUserById(userId!),
    enabled: !!userId,
  });

  const roleNames: string[] = (u?.roles || []).map((r: { role?: { name: string } }) => r.role?.name).filter(Boolean) as string[];
  const isAdminUser = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');
  const isSuper = roleNames.includes('SUPER_ADMIN');

  const changeRole = async (promote: boolean) => {
    if (!userId) return;
    setRoleBusy(true);
    setRoleError('');
    try {
      if (promote) await adminService.promoteToAdmin(userId);
      else await adminService.removeAdmin(userId);
      await queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setRoleError(err?.response?.data?.message || err?.message || 'Role update failed');
    } finally {
      setRoleBusy(false);
    }
  };

  if (!userId) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 bottom-0 z-[110] w-full max-w-2xl bg-[#0a0a0a] border-l border-[#222] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-yellow-500" />
            User Profile
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-md hover:bg-[#222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#333]">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-[#222] rounded-xl" />
              <div className="h-48 bg-[#222] rounded-xl" />
              <div className="h-48 bg-[#222] rounded-xl" />
            </div>
          ) : !u ? (
            <div className="py-20 text-center text-zinc-500">User not found.</div>
          ) : (
            <div className="space-y-8">
              {/* Profile Header */}
              <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#111] border border-[#222]">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-2xl font-bold">
                  {(u.profile?.firstName?.[0] || u.email[0]).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    {[u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || u.email}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-2">{u.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={u.status} />
                    <KycPill status={u.profile?.kycStatus} />
                    {u.demoModeEnabled && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-500">
                        Demo Mode
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-yellow-500" /> Wallets
                  </h4>
                  <div className="space-y-2">
                    {u.wallets?.length ? u.wallets.map((w: { id: string; currency: string; type: string; balance: string | number }) => (
                      <div key={w.id} className="flex justify-between p-3 rounded-lg bg-[#111] border border-[#222]">
                        <span className="text-sm text-zinc-400">{w.currency} ({w.type})</span>
                        <span className="text-sm font-mono text-white">{Number(w.balance).toFixed(2)}</span>
                      </div>
                    )) : <p className="text-sm text-zinc-600">No wallets.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-yellow-500" /> Trading Accounts
                  </h4>
                  <div className="space-y-2">
                    {u.tradingAccounts?.length ? u.tradingAccounts.map((a: { id: string; accountNumber: string; balance: string | number }) => (
                      <div key={a.id} className="flex justify-between p-3 rounded-lg bg-[#111] border border-[#222]">
                        <span className="text-sm text-zinc-400">{a.accountNumber}</span>
                        <span className="text-sm font-mono text-white">${Number(a.balance).toFixed(2)}</span>
                      </div>
                    )) : <p className="text-sm text-zinc-600">No trading accounts.</p>}
                  </div>
                </div>
              </div>

              {/* Admin Role */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-yellow-500" /> Admin Role
                </h4>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#222]">
                  <span className="text-sm text-zinc-400">
                    {isSuper ? 'Super Administrator' : isAdminUser ? 'Administrator' : 'Standard user'}
                  </span>
                  {!isSuper && u.id !== currentUserId && (
                    <button
                      id={isAdminUser ? 'remove-admin-btn' : 'promote-admin-btn'}
                      type="button"
                      disabled={roleBusy}
                      onClick={() => changeRole(!isAdminUser)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 ${isAdminUser ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-yellow-500 text-black hover:bg-yellow-400'}`}
                    >
                      {roleBusy ? 'Saving…' : isAdminUser ? 'Remove Admin' : 'Promote to Admin'}
                    </button>
                  )}
                </div>
                {roleError && <p className="mt-2 text-xs text-red-400">{roleError}</p>}
              </div>

              {/* KYC & Referral */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-yellow-500" /> KYC Documents
                  </h4>
                  <div className="space-y-2">
                    {u.kycDocuments?.length ? u.kycDocuments.map((d: { id: string; documentType: string; status: string }) => (
                      <div key={d.id} className="flex justify-between p-3 rounded-lg bg-[#111] border border-[#222]">
                        <span className="text-sm text-zinc-400">{d.documentType}</span>
                        <KycPill status={d.status} />
                      </div>
                    )) : <p className="text-sm text-zinc-600">No documents.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-yellow-500" /> Referral
                  </h4>
                  <div className="p-3 rounded-lg bg-[#111] border border-[#222] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Code</span>
                      <span className="text-sm font-mono text-white">{u.referralCode || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Referred By</span>
                      <span className="text-sm text-white">{u.referredByUser?.email || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Referrals Made</span>
                      <span className="text-sm text-white">{u.referralsMade?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
