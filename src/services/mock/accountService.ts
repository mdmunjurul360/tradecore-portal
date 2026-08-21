import { TradingAccount, AccountType, PlatformType, Leverage, AccountStatus } from '../../types';
import { apiClient } from '../api/client';

const STORAGE_KEY = 'tradecore_trading_accounts_v2';

const INITIAL_ACCOUNTS: TradingAccount[] = [
  {
    id: 'acc-1',
    accountNumber: '8492041',
    nickname: 'Main Scalper Pro',
    status: 'real',
    type: 'pro',
    platform: 'MT5',
    server: 'TradeCore-Real01',
    currency: 'USD',
    balance: 14850.50,
    equity: 15215.20,
    margin: 1240.00,
    freeMargin: 13975.20,
    marginLevel: 1227.03,
    floatingPL: 364.70,
    leverage: '1:500',
    isArchived: false,
    createdAt: '2025-11-12T10:30:00Z',
    lastActive: '2026-08-16T11:45:00Z',
  },
  {
    id: 'acc-2',
    accountNumber: '5920381',
    nickname: 'Swing Trader Standard',
    status: 'real',
    type: 'standard',
    platform: 'MT5',
    server: 'TradeCore-Real02',
    currency: 'USD',
    balance: 6240.00,
    equity: 6185.50,
    margin: 450.00,
    freeMargin: 5735.50,
    marginLevel: 1374.55,
    floatingPL: -54.50,
    leverage: '1:200',
    isArchived: false,
    createdAt: '2026-01-20T14:15:00Z',
    lastActive: '2026-08-16T09:20:00Z',
  },
  {
    id: 'acc-3',
    accountNumber: '9182374',
    nickname: 'Gold & Crypto Raw',
    status: 'real',
    type: 'raw_spread',
    platform: 'WebTerminal',
    server: 'TradeCore-ECN01',
    currency: 'USD',
    balance: 28950.00,
    equity: 29420.80,
    margin: 3100.00,
    freeMargin: 26320.80,
    marginLevel: 949.05,
    floatingPL: 470.80,
    leverage: '1:1000',
    isArchived: false,
    createdAt: '2026-03-05T08:00:00Z',
    lastActive: '2026-08-16T12:05:00Z',
  },
  {
    id: 'acc-4',
    accountNumber: '3049182',
    nickname: 'Automated EA Demo',
    status: 'demo',
    type: 'raw_spread',
    platform: 'MT5',
    server: 'TradeCore-Demo01',
    currency: 'USD',
    balance: 10000.00,
    equity: 10450.00,
    margin: 800.00,
    freeMargin: 9650.00,
    marginLevel: 1306.25,
    floatingPL: 450.00,
    leverage: '1:500',
    isArchived: false,
    createdAt: '2026-06-10T16:20:00Z',
    lastActive: '2026-08-15T18:30:00Z',
  },
  {
    id: 'acc-5',
    accountNumber: '4820195',
    nickname: 'Price Action Demo',
    status: 'demo',
    type: 'standard',
    platform: 'MT4',
    server: 'TradeCore-Demo02',
    currency: 'USD',
    balance: 5000.00,
    equity: 4920.00,
    margin: 350.00,
    freeMargin: 4570.00,
    marginLevel: 1405.71,
    floatingPL: -80.00,
    leverage: '1:200',
    isArchived: false,
    createdAt: '2026-07-01T11:00:00Z',
    lastActive: '2026-08-14T14:10:00Z',
  },
  {
    id: 'acc-6',
    accountNumber: '1928374',
    nickname: 'Old Testing MT4',
    status: 'archived',
    type: 'standard',
    platform: 'MT4',
    server: 'TradeCore-Real01',
    currency: 'USD',
    balance: 0.00,
    equity: 0.00,
    margin: 0.00,
    freeMargin: 0.00,
    marginLevel: 0,
    floatingPL: 0.00,
    leverage: '1:100',
    isArchived: true,
    createdAt: '2025-05-18T09:00:00Z',
    lastActive: '2025-10-01T12:00:00Z',
  }
];

class AccountService {
  private getStore(): TradingAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
    return INITIAL_ACCOUNTS;
  }

  private saveStore(accounts: TradingAccount[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }

  public async getAccounts(status?: AccountStatus): Promise<TradingAccount[]> {
    const accounts = this.getStore();
    const filtered = status ? accounts.filter(a => a.status === status) : accounts;
    const res = await apiClient.mockDelay(filtered, 180);
    return res.data;
  }

  public async getAccountById(id: string): Promise<TradingAccount | null> {
    const accounts = this.getStore();
    const acc = accounts.find(a => a.id === id || a.accountNumber === id) || null;
    const res = await apiClient.mockDelay(acc, 150);
    return res.data;
  }

  public async createAccount(params: {
    type: AccountType;
    status: 'real' | 'demo';
    platform: PlatformType;
    currency: string;
    leverage: Leverage;
    nickname: string;
    initialDeposit?: number;
  }): Promise<TradingAccount> {
    const accounts = this.getStore();
    const randomAccNum = Math.floor(1000000 + Math.random() * 9000000).toString();
    const initialBal = params.status === 'demo' ? (params.initialDeposit || 10000) : 0;

    const newAccount: TradingAccount = {
      id: `acc-${Date.now()}`,
      accountNumber: randomAccNum,
      nickname: params.nickname || `${params.type.toUpperCase()} ${params.platform}`,
      status: params.status,
      type: params.type,
      platform: params.platform,
      server: params.status === 'real' ? 'TradeCore-Real02' : 'TradeCore-Demo01',
      currency: params.currency || 'USD',
      balance: initialBal,
      equity: initialBal,
      margin: 0,
      freeMargin: initialBal,
      marginLevel: 0,
      floatingPL: 0,
      leverage: params.leverage,
      isArchived: false,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    accounts.unshift(newAccount);
    this.saveStore(accounts);

    const res = await apiClient.mockDelay(newAccount, 350);
    return res.data;
  }

  public async updateAccount(id: string, updates: Partial<TradingAccount>): Promise<TradingAccount> {
    const accounts = this.getStore();
    const index = accounts.findIndex(a => a.id === id || a.accountNumber === id);
    if (index === -1) throw new Error('Account not found');

    accounts[index] = { ...accounts[index], ...updates };
    this.saveStore(accounts);

    const res = await apiClient.mockDelay(accounts[index], 200);
    return res.data;
  }

  public async archiveAccount(id: string): Promise<boolean> {
    const accounts = this.getStore();
    const acc = accounts.find(a => a.id === id || a.accountNumber === id);
    if (!acc) return false;

    acc.isArchived = true;
    acc.status = 'archived';
    this.saveStore(accounts);
    return true;
  }

  public async unarchiveAccount(id: string, targetStatus: 'real' | 'demo' = 'real'): Promise<boolean> {
    const accounts = this.getStore();
    const acc = accounts.find(a => a.id === id || a.accountNumber === id);
    if (!acc) return false;

    acc.isArchived = false;
    acc.status = targetStatus;
    this.saveStore(accounts);
    return true;
  }

  public async updateBalance(id: string, deltaAmount: number): Promise<TradingAccount> {
    const accounts = this.getStore();
    const index = accounts.findIndex(a => a.id === id || a.accountNumber === id);
    if (index === -1) throw new Error('Account not found');

    const acc = accounts[index];
    const newBal = Math.max(0, acc.balance + deltaAmount);
    acc.balance = newBal;
    acc.equity = newBal + acc.floatingPL;
    acc.freeMargin = Math.max(0, acc.equity - acc.margin);
    
    this.saveStore(accounts);
    return acc;
  }
}

export const accountService = new AccountService();
