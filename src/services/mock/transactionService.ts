import { Transaction, TransactionType, TransactionStatus } from '../../types';
import { apiClient } from '../api/client';

const STORAGE_KEY = 'tradecore_transactions_v2';

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1001',
    reference: 'DEP-839210',
    type: 'deposit',
    status: 'completed',
    accountId: 'acc-1',
    accountNumber: '8492041',
    paymentMethodId: 'pm-usdt',
    paymentMethodName: 'Tether (USDT TRC20)',
    amount: 5000.00,
    fee: 0.00,
    netAmount: 5000.00,
    currency: 'USD',
    createdAt: '2026-08-15T14:30:00Z',
    completedAt: '2026-08-15T14:32:15Z',
    notes: 'Blockchain deposit confirmed via Tron network',
  },
  {
    id: 'tx-1002',
    reference: 'WTH-492018',
    type: 'withdrawal',
    status: 'completed',
    accountId: 'acc-3',
    accountNumber: '9182374',
    paymentMethodId: 'pm-card',
    paymentMethodName: 'Visa Card ending 4819',
    amount: 1200.00,
    fee: 0.00,
    netAmount: 1200.00,
    currency: 'USD',
    createdAt: '2026-08-14T09:15:00Z',
    completedAt: '2026-08-14T09:18:00Z',
    notes: 'Instant card payout approved',
  },
  {
    id: 'tx-1003',
    reference: 'TRF-193847',
    type: 'transfer',
    status: 'completed',
    accountId: 'acc-1',
    accountNumber: '8492041',
    toAccountId: 'acc-2',
    toAccountNumber: '5920381',
    paymentMethodId: 'internal-transfer',
    paymentMethodName: 'Internal Account Transfer',
    amount: 1500.00,
    fee: 0.00,
    netAmount: 1500.00,
    currency: 'USD',
    createdAt: '2026-08-12T16:45:00Z',
    completedAt: '2026-08-12T16:45:05Z',
    notes: 'Rebalancing swing account capital',
  },
  {
    id: 'tx-1004',
    reference: 'DEP-718293',
    type: 'deposit',
    status: 'completed',
    accountId: 'acc-3',
    accountNumber: '9182374',
    paymentMethodId: 'pm-binance-pay',
    paymentMethodName: 'Binance Pay',
    amount: 10000.00,
    fee: 0.00,
    netAmount: 10000.00,
    currency: 'USD',
    createdAt: '2026-08-10T11:20:00Z',
    completedAt: '2026-08-10T11:21:00Z',
    notes: 'Instant Binance Pay merchant payment',
  },
  {
    id: 'tx-1005',
    reference: 'WTH-994821',
    type: 'withdrawal',
    status: 'processing',
    accountId: 'acc-1',
    accountNumber: '8492041',
    paymentMethodId: 'pm-bank',
    paymentMethodName: 'International Bank Wire',
    amount: 3500.00,
    fee: 0.00,
    netAmount: 3500.00,
    currency: 'USD',
    createdAt: '2026-08-16T10:00:00Z',
    notes: 'Pending intermediary SWIFT verification',
  },
  {
    id: 'tx-1006',
    reference: 'REB-384910',
    type: 'rebate',
    status: 'completed',
    accountId: 'acc-1',
    accountNumber: '8492041',
    paymentMethodId: 'system-rebate',
    paymentMethodName: 'Partner Volume Rebate',
    amount: 145.80,
    fee: 0.00,
    netAmount: 145.80,
    currency: 'USD',
    createdAt: '2026-08-01T00:00:00Z',
    completedAt: '2026-08-01T00:01:00Z',
    notes: 'Monthly high-volume trading commission cashback',
  },
  {
    id: 'tx-1007',
    reference: 'DEP-291834',
    type: 'deposit',
    status: 'completed',
    accountId: 'acc-2',
    accountNumber: '5920381',
    paymentMethodId: 'pm-card',
    paymentMethodName: 'Mastercard ending 9012',
    amount: 2500.00,
    fee: 0.00,
    netAmount: 2500.00,
    currency: 'USD',
    createdAt: '2026-07-25T18:00:00Z',
    completedAt: '2026-07-25T18:02:00Z',
  }
];

class TransactionService {
  private getStore(): Transaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  }

  private saveStore(txs: Transaction[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
  }

  public async getTransactions(filters?: {
    type?: TransactionType | 'all';
    status?: TransactionStatus | 'all';
    accountId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> {
    let list = this.getStore();

    if (filters) {
      if (filters.type && filters.type !== 'all') {
        list = list.filter(t => t.type === filters.type);
      }
      if (filters.status && filters.status !== 'all') {
        list = list.filter(t => t.status === filters.status);
      }
      if (filters.accountId && filters.accountId !== 'all') {
        list = list.filter(t => t.accountId === filters.accountId || t.accountNumber === filters.accountId);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(t =>
          t.reference.toLowerCase().includes(q) ||
          t.accountNumber.includes(q) ||
          t.paymentMethodName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      }
    }

    const res = await apiClient.mockDelay(list, 180);
    return res.data;
  }

  public async addTransaction(data: Omit<Transaction, 'id' | 'reference' | 'createdAt'>): Promise<Transaction> {
    const list = this.getStore();
    const prefix = data.type === 'deposit' ? 'DEP' : data.type === 'withdrawal' ? 'WTH' : 'TRF';
    const randomRef = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      reference: randomRef,
      createdAt: new Date().toISOString(),
      completedAt: data.status === 'completed' ? new Date().toISOString() : undefined,
      ...data,
    };

    list.unshift(newTx);
    this.saveStore(list);
    return newTx;
  }

  public async createTransaction(params: any): Promise<Transaction> {
    const list = this.getStore();
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      reference: params.reference || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: params.type || 'transfer',
      status: params.status || 'completed',
      accountId: params.accountId || 'acc-1',
      accountNumber: params.accountNumber || '8492041',
      toAccountId: params.toAccountId,
      toAccountNumber: params.toAccountNumber,
      paymentMethodId: params.paymentMethodId || 'internal-transfer',
      paymentMethodName: params.method || params.paymentMethodName || 'Internal Transfer',
      amount: params.amount || 0,
      fee: params.fee || 0,
      netAmount: params.netAmount || params.amount || 0,
      currency: params.currency || 'USD',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      notes: params.notes,
    };
    list.unshift(newTx);
    this.saveStore(list);
    return newTx;
  }

  public exportCsv(transactions: Transaction[]) {
    const headers = ['Reference', 'Date', 'Type', 'Account', 'Payment Method', 'Amount', 'Fee', 'Net Amount', 'Status', 'Notes'];
    const rows = transactions.map(t => [
      t.reference,
      t.createdAt,
      t.type.toUpperCase(),
      t.accountNumber,
      `"${t.paymentMethodName}"`,
      t.amount,
      t.fee,
      t.netAmount,
      t.status.toUpperCase(),
      `"${t.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradecore-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const transactionService = new TransactionService();
