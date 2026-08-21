import { PaymentMethod, Transaction } from '../../types';
import { apiClient } from '../api/client';
import { accountService } from './accountService';
import { transactionService } from './transactionService';

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm-card',
    name: 'Credit / Debit Card (Visa, Mastercard)',
    category: 'card',
    icon: 'CreditCard',
    badge: 'Instant',
    processingTime: 'Instant (0-1 min)',
    feePercent: 0,
    fixedFee: 0,
    minAmount: 10,
    maxAmount: 10000,
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    recommended: true,
    isInstant: true,
    description: 'Instant deposit using your credit or debit card with 3D Secure authentication.',
  },
  {
    id: 'pm-usdt',
    name: 'Tether (USDT TRC20 / ERC20)',
    category: 'crypto',
    icon: 'Coins',
    badge: '0% Network Fee',
    processingTime: 'Instant (1-3 min)',
    feePercent: 0,
    fixedFee: 0,
    minAmount: 10,
    maxAmount: 100000,
    supportedCurrencies: ['USD', 'USDT'],
    recommended: true,
    isInstant: true,
    description: 'Zero commission crypto deposit. Automated blockchain confirmation.',
  },
  {
    id: 'pm-btc',
    name: 'Bitcoin (BTC)',
    category: 'crypto',
    icon: 'Bitcoin',
    processingTime: '10 - 30 minutes',
    feePercent: 0,
    fixedFee: 0,
    minAmount: 50,
    maxAmount: 250000,
    supportedCurrencies: ['USD', 'BTC'],
    description: 'Deposit directly from any Bitcoin wallet with real-time rate lock.',
  },
  {
    id: 'pm-bank',
    name: 'International Bank Wire Transfer (SWIFT / SEPA)',
    category: 'bank',
    icon: 'Building2',
    processingTime: '1 - 3 business days',
    feePercent: 0,
    fixedFee: 0,
    minAmount: 500,
    maxAmount: 500000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CHF'],
    description: 'Direct institutional bank wire with zero broker fees.',
  },
  {
    id: 'pm-skrill',
    name: 'Skrill / Neteller',
    category: 'e_wallet',
    icon: 'Wallet',
    badge: 'Instant',
    processingTime: 'Instant',
    feePercent: 0,
    fixedFee: 0,
    minAmount: 10,
    maxAmount: 20000,
    supportedCurrencies: ['USD', 'EUR'],
    isInstant: true,
    description: 'Instant e-wallet funding with one-click approval.',
  },
  {
    id: 'pm-binance-pay',
    name: 'Binance Pay',
    category: 'crypto',
    icon: 'QrCode',
    badge: 'Instant',
    processingTime: 'Instant',
    feePercent: 0,
    fixedFee: 0,
    minAmount: 10,
    maxAmount: 50000,
    supportedCurrencies: ['USD', 'USDT', 'BUSD'],
    isInstant: true,
    description: 'Scan QR code in your Binance App to deposit with zero network fee.',
  },
  {
    id: 'pm-local-bank',
    name: 'Local Online Banking / Instant Wire',
    category: 'bank',
    icon: 'Landmark',
    processingTime: '15 - 30 minutes',
    feePercent: 0,
    fixedFee: 0,
    minAmount: 25,
    maxAmount: 15000,
    supportedCurrencies: ['USD', 'EUR'],
    description: 'Direct transfer using local clearing networks and mobile banking apps.',
  }
];

class PaymentService {
  public async getPaymentMethods(type?: string): Promise<PaymentMethod[]> {
    const res = await apiClient.mockDelay(PAYMENT_METHODS, 150);
    return res.data;
  }

  public async getPaymentMethodById(id: string): Promise<PaymentMethod | undefined> {
    return PAYMENT_METHODS.find(m => m.id === id);
  }

  public async processDeposit(params: {
    accountId: string;
    methodId: string;
    amount: number;
    currency?: string;
  }): Promise<{ success: boolean; transaction: Transaction }> {
    const tx = await this.createDeposit({
      accountId: params.accountId,
      paymentMethodId: params.methodId,
      amount: params.amount,
      currency: params.currency || 'USD',
    });
    return { success: true, transaction: tx };
  }

  public async processWithdrawal(params: {
    accountId: string;
    methodId: string;
    amount: number;
    currency?: string;
    destination?: string;
  }): Promise<{ success: boolean; transaction: Transaction }> {
    const tx = await this.createWithdrawal({
      accountId: params.accountId,
      paymentMethodId: params.methodId,
      amount: params.amount,
      destinationAddressOrAccount: params.destination || 'Destination Address',
      currency: params.currency || 'USD',
      twoFactorCode: '123456',
    });
    return { success: true, transaction: tx };
  }

  public async createDeposit(params: {
    accountId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
  }): Promise<Transaction> {
    const account = await accountService.getAccountById(params.accountId);
    if (!account) throw new Error('Selected trading account not found');

    const method = PAYMENT_METHODS.find(m => m.id === params.paymentMethodId) || PAYMENT_METHODS[0];

    const fee = (params.amount * method.feePercent) / 100 + method.fixedFee;
    const netAmount = params.amount - fee;

    // Create transaction record
    const transaction = await transactionService.addTransaction({
      type: 'deposit',
      status: 'completed',
      accountId: account.id,
      accountNumber: account.accountNumber,
      paymentMethodId: method.id,
      paymentMethodName: method.name,
      amount: params.amount,
      fee,
      netAmount,
      currency: params.currency || account.currency,
      notes: `Deposit via ${method.name}`,
    });

    // Update account balance
    await accountService.updateBalance(account.id, netAmount);

    return transaction;
  }

  public async createWithdrawal(params: {
    accountId: string;
    paymentMethodId: string;
    amount: number;
    destinationAddressOrAccount: string;
    currency: string;
    twoFactorCode: string;
  }): Promise<Transaction> {
    const account = await accountService.getAccountById(params.accountId);
    if (!account) throw new Error('Selected trading account not found');

    if (account.freeMargin < params.amount) {
      throw new Error(`Insufficient free margin. Available: $${account.freeMargin.toFixed(2)}`);
    }

    const method = PAYMENT_METHODS.find(m => m.id === params.paymentMethodId) || PAYMENT_METHODS[0];
    const fee = (params.amount * method.feePercent) / 100 + method.fixedFee;
    const netAmount = params.amount - fee;

    const transaction = await transactionService.addTransaction({
      type: 'withdrawal',
      status: 'processing',
      accountId: account.id,
      accountNumber: account.accountNumber,
      paymentMethodId: method.id,
      paymentMethodName: method.name,
      amount: params.amount,
      fee,
      netAmount,
      currency: params.currency || account.currency,
      notes: `Withdrawal to ${params.destinationAddressOrAccount}`,
    });

    // Deduct from account
    await accountService.updateBalance(account.id, -params.amount);

    return transaction;
  }

  public async createInternalTransfer(params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    notes?: string;
  }): Promise<Transaction> {
    if (params.fromAccountId === params.toAccountId) {
      throw new Error('Source and destination accounts cannot be the same');
    }

    const fromAcc = await accountService.getAccountById(params.fromAccountId);
    const toAcc = await accountService.getAccountById(params.toAccountId);

    if (!fromAcc || !toAcc) throw new Error('One or both accounts were not found');
    if (fromAcc.freeMargin < params.amount) {
      throw new Error(`Insufficient free margin on account #${fromAcc.accountNumber}`);
    }

    // Execute transfer
    await accountService.updateBalance(fromAcc.id, -params.amount);
    await accountService.updateBalance(toAcc.id, params.amount);

    const transaction = await transactionService.addTransaction({
      type: 'transfer',
      status: 'completed',
      accountId: fromAcc.id,
      accountNumber: fromAcc.accountNumber,
      toAccountId: toAcc.id,
      toAccountNumber: toAcc.accountNumber,
      paymentMethodId: 'internal-transfer',
      paymentMethodName: 'Internal Transfer',
      amount: params.amount,
      fee: 0,
      netAmount: params.amount,
      currency: fromAcc.currency,
      notes: params.notes || `Transfer from #${fromAcc.accountNumber} to #${toAcc.accountNumber}`,
    });

    return transaction;
  }
}

export const paymentService = new PaymentService();
