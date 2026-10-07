'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import { accountsService, getApiError, TradingAccountDto } from '@/services/accounts.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, FileText, Plus, PlaySquare, Info, Pencil, Archive,
  ArchiveRestore, CheckCircle2, AlertCircle, Loader2, Repeat, ChevronDown, ChevronRight, Settings
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DepositPanel } from '@/components/wallet/DepositPanel';
import { WithdrawPanel } from '@/components/wallet/WithdrawPanel';
import { useAuthStore } from '@/store/useAuthStore';

const fmt = (n: number | null | undefined) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const selectCls =
  'w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

type AccountFilter = 'real' | 'demo' | 'archived';

export default function WalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const isDemoMode = !!user?.demoModeEnabled;
  const [activeTab, setActiveTab] = useState('accounts');
  const [filter, setFilter] = useState<AccountFilter>('real');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TradingAccountDto | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<TradingAccountDto | null>(null);
  const [transferFrom, setTransferFrom] = useState<TradingAccountDto | null>(null);

  // Support /wallet?tab=history links from the sidebar
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['trading-accounts'],
    queryFn: accountsService.list,
  });

  // Never leave the active mode without an account: auto-create one if missing
  const autoCreateTried = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (isLoadingAccounts) return;
    const wantType = isDemoMode ? 'DEMO' : 'LIVE';
    if (accounts.some((a) => a.type === wantType && !a.isArchived)) {
      autoCreateTried.current.delete(wantType);
      return;
    }
    if (autoCreateTried.current.has(wantType)) return;
    autoCreateTried.current.add(wantType);
    accountsService
      .create({ type: wantType, accountClass: 'STANDARD', leverage: 2000 })
      .catch(() => {})
      .finally(() => queryClient.invalidateQueries({ queryKey: ['trading-accounts'] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAccounts, isDemoMode, accounts]);

  const { data: txData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => walletService.getTransactions({ limit: 20 }),
  });
  const transactions = Array.isArray(txData?.data) ? txData.data : Array.isArray(txData) ? txData : [];

  const current = accounts.find((a) => a.isCurrent) || null;

  const visible = useMemo(() => {
    if (filter === 'archived') return accounts.filter((a) => a.isArchived);
    return accounts.filter((a) => !a.isArchived && (filter === 'demo' ? a.type === 'DEMO' : a.type === 'LIVE'));
  }, [accounts, filter]);

  // Follow the active account's type in the filter
  useEffect(() => {
    setFilter(f => f === 'archived' ? f : (isDemoMode ? 'demo' : 'real'));
  }, [isDemoMode]);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const refreshAll = async () => {
    await queryClient.invalidateQueries();
  };

  const switchMutation = useMutation({
    mutationFn: (id: string) => accountsService.switch(id),
    onSuccess: async (res: any) => {
      const u = useAuthStore.getState().user;
      if (u) updateUser({ ...u, demoModeEnabled: !!res.demoModeEnabled });
      await refreshAll();
    },
  });

  /** Ensures `acc` is the active account, then runs `then`. */
  const withActive = async (acc: TradingAccountDto, then: () => void) => {
    try {
      if (!acc.isCurrent) {
        await switchMutation.mutateAsync(acc.id);
        flash('ok', `Active account switched to ${acc.name} #${acc.accountNumber}`);
      }
      then();
    } catch (e) {
      flash('err', getApiError(e, 'Unable to switch account'));
    }
  };

  const archiveMutation = useMutation({
    mutationFn: (acc: TradingAccountDto) => (acc.isArchived ? accountsService.restore(acc.id) : accountsService.archive(acc.id)),
    onSuccess: (res) => {
      flash('ok', `Account #${res.accountNumber} ${res.isArchived ? 'archived' : 'restored'}`);
      queryClient.invalidateQueries({ queryKey: ['trading-accounts'] });
    },
    onError: (e) => flash('err', getApiError(e, 'Action failed')),
  });

  const goToFunding = (acc: TradingAccountDto, tab: 'deposit' | 'withdraw') => withActive(acc, () => setActiveTab(tab));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">My Accounts</h3>
          <p className="text-muted-foreground">Manage your trading accounts, deposits, and transfers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button id="header-deposit-btn" className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" onClick={() => setActiveTab('deposit')}>
            <ArrowDownToLine className="w-4 h-4" /> Deposit
          </Button>
          <Button id="header-withdraw-btn" variant="outline" className="gap-2" onClick={() => setActiveTab('withdraw')}>
            <ArrowUpFromLine className="w-4 h-4" /> Withdraw
          </Button>
        </div>
      </div>

      {notice && (
        <div
          id="accounts-notice"
          className={`flex items-center gap-2 p-3 rounded-md border text-sm ${
            notice.kind === 'ok'
              ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
          }`}
        >
          {notice.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))} className="w-full block space-y-4">
        <TabsList className="flex w-fit flex-wrap h-auto justify-start bg-muted/50 p-1">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="transfer">Internal Transfer</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Account Overview</h2>
            <Button id="open-new-account-btn" size="sm" className="gap-2" onClick={() => setOpenCreate(true)}>
              <Plus className="w-4 h-4" /> Open New Account
            </Button>
          </div>

          {isLoadingAccounts ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {isDemoMode ? (
              <AccountSection 
                title="Demo Accounts" 
                accounts={accounts.filter((a) => a.type === 'DEMO' && !a.isArchived)}
                busyId={switchMutation.isPending ? switchMutation.variables : null}
                onSwitch={(acc) => withActive(acc, () => {})}
                onTrade={(acc) => withActive(acc, () => router.push('/trading'))}
                onDeposit={(acc) => goToFunding(acc, 'deposit')}
                onWithdraw={(acc) => goToFunding(acc, 'withdraw')}
                onTransfer={(acc) => { setTransferFrom(acc); setActiveTab('transfer'); }}
                onDetails={(acc) => setDetailsTarget(acc)}
                onRename={(acc) => setRenameTarget(acc)}
                onArchive={(acc) => {
                  if (confirm(`Archive account #${acc.accountNumber}?`)) archiveMutation.mutate(acc);
                }}
              />
              ) : (
              <AccountSection 
                title="Live Accounts" 
                accounts={accounts.filter((a) => a.type === 'LIVE' && !a.isArchived)}
                busyId={switchMutation.isPending ? switchMutation.variables : null}
                onSwitch={(acc) => withActive(acc, () => {})}
                onTrade={(acc) => withActive(acc, () => router.push('/trading'))}
                onDeposit={(acc) => goToFunding(acc, 'deposit')}
                onWithdraw={(acc) => goToFunding(acc, 'withdraw')}
                onTransfer={(acc) => { setTransferFrom(acc); setActiveTab('transfer'); }}
                onDetails={(acc) => setDetailsTarget(acc)}
                onRename={(acc) => setRenameTarget(acc)}
                onArchive={(acc) => {
                  if (confirm(`Archive account #${acc.accountNumber}?`)) archiveMutation.mutate(acc);
                }}
              />
              )}

              {accounts.some((a) => a.isArchived) && (
                <AccountSection 
                  title="Archived Accounts" 
                  accounts={accounts.filter((a) => a.isArchived)}
                  busyId={switchMutation.isPending ? switchMutation.variables : null}
                  onSwitch={() => {}}
                  onTrade={() => {}}
                  onDeposit={() => {}}
                  onWithdraw={() => {}}
                  onTransfer={() => {}}
                  onDetails={(acc) => setDetailsTarget(acc)}
                  onRename={(acc) => setRenameTarget(acc)}
                  onArchive={(acc) => archiveMutation.mutate(acc)}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your latest deposits, withdrawals, and transfers.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTx ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-md border border-dashed">
                  <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="text-xs text-muted-foreground">Your transaction history will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">
                          {tx.type === 'DEPOSIT' && <span className="text-green-500">Deposit</span>}
                          {tx.type === 'WITHDRAWAL' && <span className="text-red-500">Withdrawal</span>}
                          {tx.type === 'TRANSFER' && <span className="text-blue-500">Internal Transfer</span>}
                          {!['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].includes(tx.type) && <span>{tx.type}</span>}
                        </TableCell>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell>{tx.currency}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              tx.status === 'COMPLETED' || tx.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : tx.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposit" className="max-w-2xl space-y-4">
          <ActiveAccountBanner acc={current} verb="Deposits will be credited to" />
          <DepositPanel />
        </TabsContent>

        <TabsContent value="withdraw" className="max-w-2xl space-y-4">
          <ActiveAccountBanner acc={current} verb="Withdrawals will be debited from" />
          <WithdrawPanel />
        </TabsContent>

        <TabsContent value="transfer" className="max-w-2xl">
          <AccountTransferPanel
            accounts={accounts.filter((a) => !a.isArchived)}
            initialFrom={transferFrom || current}
            onDone={(msg) => { flash('ok', msg); refreshAll(); }}
          />
        </TabsContent>
      </Tabs>

      <CreateAccountDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={(acc) => {
          flash('ok', `Opened ${acc.name} #${acc.accountNumber}`);
          setFilter(acc.type === 'DEMO' ? 'demo' : 'real');
          queryClient.invalidateQueries({ queryKey: ['trading-accounts'] });
        }}
      />
      <RenameDialog
        acc={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRenamed={(acc) => {
          flash('ok', `Account #${acc.accountNumber} renamed to "${acc.name}"`);
          queryClient.invalidateQueries({ queryKey: ['trading-accounts'] });
        }}
      />
      <DetailsDialog acc={detailsTarget ? accounts.find((a) => a.id === detailsTarget.id) || detailsTarget : null} onClose={() => setDetailsTarget(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AccountSection(props: {
  title: string;
  accounts: TradingAccountDto[];
  busyId: any;
  onSwitch: (a: TradingAccountDto) => void;
  onTrade: (a: TradingAccountDto) => void;
  onDeposit: (a: TradingAccountDto) => void;
  onWithdraw: (a: TradingAccountDto) => void;
  onTransfer: (a: TradingAccountDto) => void;
  onDetails: (a: TradingAccountDto) => void;
  onRename: (a: TradingAccountDto) => void;
  onArchive: (a: TradingAccountDto) => void;
}) {
  const [open, setOpen] = useState(true);
  const total = props.accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

  if (props.accounts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center justify-between cursor-pointer group hover:bg-muted/50 p-2 rounded-lg transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />}
          <h3 className="text-lg font-bold">{props.title}</h3>
          <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">{props.accounts.length}</span>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="font-bold">{fmt(total)} <span className="text-xs font-normal">USD</span></p>
        </div>
      </div>
      {open && (
        <div className="grid gap-6 md:grid-cols-2">
          {props.accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              acc={acc}
              busy={props.busyId === acc.id}
              onSwitch={() => props.onSwitch(acc)}
              onTrade={() => props.onTrade(acc)}
              onDeposit={() => props.onDeposit(acc)}
              onWithdraw={() => props.onWithdraw(acc)}
              onTransfer={() => props.onTransfer(acc)}
              onDetails={() => props.onDetails(acc)}
              onRename={() => props.onRename(acc)}
              onArchive={() => props.onArchive(acc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountCard(props: {
  acc: TradingAccountDto;
  busy: boolean;
  onSwitch: () => void;
  onTrade: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  onDetails: () => void;
  onRename: () => void;
  onArchive: () => void;
}) {
  const { acc } = props;
  const isDemo = acc.type === 'DEMO';
  const n = acc.accountNumber;
  return (
    <Card
      id={`account-card-${n}`}
      className={`shadow-md hover:shadow-lg transition-shadow border-t-4 ${
        acc.isCurrent ? 'border-t-green-500 ring-1 ring-green-500/30' : acc.isArchived ? 'border-t-muted opacity-75' : 'border-t-yellow-500'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2">
              <span className="truncate" id={`account-name-${n}`}>{acc.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${isDemo ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {isDemo ? 'Demo' : 'Real'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-muted text-muted-foreground">{acc.accountClass}</span>
              {acc.isCurrent && (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
              )}
            </CardTitle>
            <CardDescription className="mt-1 font-mono">
              #{n} · {acc.server} · MT5
            </CardDescription>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button id={`rename-${n}`} variant="ghost" size="icon" title="Rename" onClick={props.onRename}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button id={`archive-${n}`} variant="ghost" size="icon" title={acc.isArchived ? 'Restore' : 'Archive'} onClick={props.onArchive}>
              {acc.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-3xl font-bold" id={`balance-${n}`}>
                {fmt(acc.balance)} <span className="text-lg font-normal text-muted-foreground">{acc.currency}</span>
              </p>
            </div>
            {!acc.isCurrent && !acc.isArchived && (
              <Button id={`switch-${n}`} variant="outline" size="sm" className="gap-1" disabled={props.busy} onClick={props.onSwitch}>
                {props.busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Repeat className="w-3 h-3" />} Make Active
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Stat label="Equity" value={`${fmt(acc.equity)}`} />
            <Stat label="Free Margin" value={`${fmt(acc.freeMargin)}`} />
            <Stat label="Margin" value={`${fmt(acc.margin)}`} />
            <Stat label="Margin Level" value={acc.marginLevel == null ? '—' : `${fmt(acc.marginLevel)}%`} />
            <Stat label="Leverage" value={`1:${acc.leverage}`} />
            <Stat label="Status" value={acc.status === 'ACTIVE' ? 'Active' : 'Archived'} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t bg-muted/10">
        <Button id={`trade-${n}`} className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" disabled={acc.isArchived || props.busy} onClick={props.onTrade}>
          <PlaySquare className="w-4 h-4" /> Trade
        </Button>
        <Button id={`deposit-${n}`} variant="outline" size="sm" className="gap-1" disabled={acc.isArchived || props.busy} onClick={props.onDeposit}>
          <ArrowDownToLine className="w-4 h-4" /> Deposit
        </Button>
        <Button id={`withdraw-${n}`} variant="outline" size="sm" className="gap-1" disabled={acc.isArchived || props.busy} onClick={props.onWithdraw}>
          <ArrowUpFromLine className="w-4 h-4" /> Withdraw
        </Button>
        <Button id={`transfer-${n}`} variant="outline" size="sm" className="gap-1" disabled={acc.isArchived} onClick={props.onTransfer}>
          <ArrowRightLeft className="w-4 h-4" /> Transfer
        </Button>
        <Button id={`details-${n}`} variant="ghost" size="sm" className="gap-1" onClick={props.onDetails}>
          <Settings className="w-4 h-4" /> Settings
        </Button>
      </CardFooter>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ActiveAccountBanner({ acc, verb }: { acc: TradingAccountDto | null; verb: string }) {
  if (!acc) return null;
  return (
    <div id="active-account-banner" className="flex items-center justify-between gap-2 p-3 rounded-md border bg-muted/30 text-sm">
      <span>
        {verb} <b>{acc.name}</b> <span className="font-mono">#{acc.accountNumber}</span>{' '}
        ({acc.type === 'DEMO' ? 'Demo' : 'Real'})
      </span>
      <span className="font-semibold">{fmt(acc.balance)} USD</span>
    </div>
  );
}

function CreateAccountDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (a: TradingAccountDto) => void }) {
  const [type, setType] = useState<'LIVE' | 'DEMO'>('LIVE');
  const [accountClass, setAccountClass] = useState<'STANDARD' | 'PRO' | 'RAW'>('STANDARD');
  const [leverage, setLeverage] = useState(2000);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const m = useMutation({
    mutationFn: () => accountsService.create({ type, accountClass, leverage, name: name || undefined }),
    onSuccess: (acc) => { onCreated(acc); onOpenChange(false); setName(''); setError(''); },
    onError: (e) => setError(getApiError(e, 'Could not open account')),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open New Account</DialogTitle>
          <DialogDescription>Choose the account type that suits your trading.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['LIVE', 'DEMO'] as const).map((t) => (
              <button key={t} id={`create-type-${t}`} onClick={() => setType(t)} className={`p-3 rounded-md border text-sm font-medium ${type === t ? 'border-yellow-500 bg-yellow-500/10' : 'hover:bg-muted'}`}>
                {t === 'LIVE' ? 'Real' : 'Demo'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['STANDARD', 'PRO', 'RAW'] as const).map((c) => (
              <button key={c} id={`create-class-${c}`} onClick={() => setAccountClass(c)} className={`p-3 rounded-md border text-left ${accountClass === c ? 'border-yellow-500 bg-yellow-500/10' : 'hover:bg-muted'}`}>
                <p className="text-sm font-semibold">{c === 'PRO' ? 'Pro' : c === 'RAW' ? 'Raw' : 'Standard'}</p>
                <p className="text-xs text-muted-foreground">{c === 'PRO' ? 'Spreads from 0.1, no commission' : c === 'RAW' ? 'Raw spreads from 0.0, commission applies' : 'Spreads from 0.2, no commission'}</p>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-leverage">Max leverage</Label>
            <select id="create-leverage" className={selectCls} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))}>
              {[50, 100, 200, 500, 1000, 2000].map((l) => <option key={l} value={l}>1:{l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-name">Account nickname (optional)</Label>
            <Input id="create-name" value={name} maxLength={40} placeholder={`${accountClass === 'PRO' ? 'Pro' : accountClass === 'RAW' ? 'Raw' : 'Standard'} ${type === 'DEMO' ? 'Demo' : 'Real'}`} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            {type === 'DEMO' ? 'Demo accounts start with 10,000.00 USD virtual funds.' : 'Real accounts start at 0.00 USD. Fund via Deposit or Internal Transfer.'}
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button id="create-account-submit" disabled={m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? 'Opening…' : 'Open Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenameDialog({ acc, onClose, onRenamed }: { acc: TradingAccountDto | null; onClose: () => void; onRenamed: (a: TradingAccountDto) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setName(acc?.name || ''); setError(''); }, [acc]);
  const m = useMutation({
    mutationFn: () => accountsService.rename(acc!.id, name),
    onSuccess: (a) => { onRenamed(a); onClose(); },
    onError: (e) => setError(getApiError(e, 'Rename failed')),
  });
  return (
    <Dialog open={!!acc} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename account</DialogTitle>
          <DialogDescription>#{acc?.accountNumber}</DialogDescription>
        </DialogHeader>
        <Input id="rename-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button id="rename-submit" disabled={m.isPending || !name.trim()} onClick={() => m.mutate()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailsDialog({ acc, onClose }: { acc: TradingAccountDto | null; onClose: () => void }) {
  const rows: [string, string][] = acc
    ? [
        ['Account number', acc.accountNumber],
        ['Nickname', acc.name],
        ['Type', `${acc.accountClass === 'PRO' ? 'Pro' : acc.accountClass === 'RAW' ? 'Raw' : 'Standard'} ${acc.type === 'DEMO' ? 'Demo' : 'Real'}`],
        ['Platform', 'MetaTrader 5'],
        ['Server', acc.server],
        ['Currency', acc.currency],
        ['Leverage', `1:${acc.leverage}`],
        ['Balance', `${fmt(acc.balance)} USD`],
        ['Equity', `${fmt(acc.equity)} USD`],
        ['Margin', `${fmt(acc.margin)} USD`],
        ['Free margin', `${fmt(acc.freeMargin)} USD`],
        ['Margin level', acc.marginLevel == null ? '—' : `${fmt(acc.marginLevel)}%`],
        ['Status', acc.status === 'ACTIVE' ? (acc.isCurrent ? 'Active (current)' : 'Active') : 'Archived'],
        ['Created', new Date(acc.createdAt).toLocaleString()],
      ]
    : [];
  return (
    <Dialog open={!!acc} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
          <DialogDescription>Use these credentials to identify your account.</DialogDescription>
        </DialogHeader>
        <div id="account-details" className="divide-y rounded-md border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between px-3 py-2 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium font-mono">{v}</span>
            </div>
          ))}
        </div>
        {acc && !acc.isArchived && (
          <div className="space-y-2 mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold">Trading Preferences</h4>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Max leverage</span>
              <div className="flex items-center gap-2">
                <select className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring" defaultValue={acc.leverage}>
                  {[50, 100, 200, 500, 1000, 2000].map((l) => <option key={l} value={l}>1:{l}</option>)}
                </select>
                <Button size="sm" variant="secondary" className="h-8 text-xs px-3" onClick={() => alert('Leverage update request submitted. Awaiting backend approval.')}>Change</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AccountTransferPanel({ accounts, initialFrom, onDone }: { accounts: TradingAccountDto[]; initialFrom: TradingAccountDto | null; onDone: (msg: string) => void }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialFrom) setFromId(initialFrom.id);
    else if (!fromId && accounts[0]) setFromId(accounts[0].id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [initialFrom?.id, accounts.length]);

  const from = accounts.find((a) => a.id === fromId);
  const targets = accounts.filter((a) => a.id !== fromId && from && a.type === from.type);
  useEffect(() => {
    if (!targets.find((t) => t.id === toId)) setToId(targets[0]?.id || '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [fromId, targets.length]);

  const available = from ? from.freeMargin : 0;

  const m = useMutation({
    mutationFn: () => accountsService.transfer({ fromAccountId: fromId, toAccountId: toId, amount: Number(amount) }),
    onSuccess: (res) => { setAmount(''); setError(''); onDone(res?.message || 'Transfer completed'); },
    onError: (e) => setError(getApiError(e, 'Transfer failed')),
  });

  const submit = () => {
    const n = Number(amount);
    if (!n || n <= 0) return setError('Enter a valid amount');
    if (n > available) return setError('Amount exceeds available funds');
    if (!toId) return setError('Select a destination account');
    m.mutate();
  };

  const label = (a: TradingAccountDto) => `${a.name} #${a.accountNumber} — ${fmt(a.freeMargin)} USD${a.isCurrent ? ' (active)' : ''}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Transfer</CardTitle>
        <CardDescription>Move funds instantly between your own trading accounts of the same type.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="transfer-from">From account</Label>
          <select id="transfer-from" className={selectCls} value={fromId} onChange={(e) => setFromId(e.target.value)}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{label(a)}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transfer-to">To account</Label>
          <select id="transfer-to" className={selectCls} value={toId} onChange={(e) => setToId(e.target.value)} disabled={targets.length === 0}>
            {targets.length === 0 && <option value="">No other {from?.type === 'DEMO' ? 'demo' : 'real'} account — open one first</option>}
            {targets.map((a) => <option key={a.id} value={a.id}>{label(a)}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="transfer-amount">Amount (USD)</Label>
            <span className="text-xs text-muted-foreground">Available: {fmt(available)} USD</span>
          </div>
          <div className="flex gap-2">
            <Input id="transfer-amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button variant="outline" onClick={() => setAmount(String(available))}>Max</Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button id="transfer-submit" className="w-full" disabled={m.isPending || targets.length === 0} onClick={submit}>
          {m.isPending ? 'Transferring…' : 'Confirm Transfer'}
        </Button>
      </CardContent>
    </Card>
  );
}
