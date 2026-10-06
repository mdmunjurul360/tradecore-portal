/**
 * Exchange Wallet Service — Professional Deposit, Withdrawal, and History Management
 * Follows the Binance/Bybit/OKX exchange wallet pattern
 */

import { apiClient } from '../api/client';

// ──────── Types ────────

export interface WalletCoin {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  locked: number;
  inOrder: number;
  available: number;
  usdRate: number;
  usdValue: number;
  change24h: number;
  networks: WalletNetwork[];
  iconColor: string;
}

export interface WalletNetwork {
  id: string;
  name: string;
  shortName: string;
  address: string;
  memo?: string;
  minDeposit: number;
  minWithdraw: number;
  withdrawFee: number;
  confirmations: number;
  estimatedTime: string;
  isDefault: boolean;
  contractAddress?: string;
}

export interface DepositRecord {
  id: string;
  coin: string;
  network: string;
  amount: number;
  usdValue: number;
  address: string;
  txHash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  completedAt?: string;
}

export interface WithdrawalRecord {
  id: string;
  coin: string;
  network: string;
  amount: number;
  fee: number;
  netAmount: number;
  usdValue: number;
  toAddress: string;
  txHash: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
  rejectionReason?: string;
}

export interface ExchangeWalletSummary {
  totalUsdValue: number;
  totalAvailable: number;
  totalLocked: number;
  totalInOrder: number;
  coins: WalletCoin[];
  changePercent24h: number;
}

// ──────── Data ────────

const NETWORK_ADDRESSES: Record<string, WalletNetwork[]> = {
  BTC: [
    {
      id: 'btc-native', name: 'Bitcoin', shortName: 'BTC',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      minDeposit: 0.0001, minWithdraw: 0.001, withdrawFee: 0.00005,
      confirmations: 2, estimatedTime: '~30 min', isDefault: true,
    },
    {
      id: 'btc-lightning', name: 'Lightning Network', shortName: 'Lightning',
      address: 'lnbc1qvqp8sdq2gd5kxmmu4d25hkqnz4gprqa0s',
      minDeposit: 0.00001, minWithdraw: 0.00001, withdrawFee: 0.000001,
      confirmations: 0, estimatedTime: '~Instant', isDefault: false,
    },
  ],
  ETH: [
    {
      id: 'eth-erc20', name: 'Ethereum (ERC20)', shortName: 'ERC20',
      address: '0x71C8360f388742CE0808363A75990664b3d48F40',
      minDeposit: 0.01, minWithdraw: 0.01, withdrawFee: 0.0012,
      confirmations: 12, estimatedTime: '~5 min', isDefault: true,
    },
  ],
  BNB: [
    {
      id: 'bnb-bsc', name: 'BNB Smart Chain (BEP20)', shortName: 'BSC',
      address: '0x71C8360f388742CE0808363A75990664b3d48F40',
      minDeposit: 0.01, minWithdraw: 0.02, withdrawFee: 0.0005,
      confirmations: 15, estimatedTime: '~3 min', isDefault: true,
    },
    {
      id: 'bnb-beacon', name: 'BNB Beacon Chain (BEP2)', shortName: 'BEP2',
      address: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
      memo: '108942745',
      minDeposit: 0.01, minWithdraw: 0.05, withdrawFee: 0.001,
      confirmations: 1, estimatedTime: '~1 min', isDefault: false,
    },
  ],
  TRX: [
    {
      id: 'trx-trc20', name: 'Tron (TRC20)', shortName: 'TRC20',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      minDeposit: 1, minWithdraw: 10, withdrawFee: 1,
      confirmations: 20, estimatedTime: '~1 min', isDefault: true,
    },
  ],
  USDT: [
    {
      id: 'usdt-trc20', name: 'Tron (TRC20)', shortName: 'TRC20',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      minDeposit: 1, minWithdraw: 10, withdrawFee: 1,
      confirmations: 20, estimatedTime: '~1 min', isDefault: true,
    },
    {
      id: 'usdt-erc20', name: 'Ethereum (ERC20)', shortName: 'ERC20',
      address: '0x71C8360f388742CE0808363A75990664b3d48F40',
      contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      minDeposit: 10, minWithdraw: 20, withdrawFee: 5,
      confirmations: 12, estimatedTime: '~5 min', isDefault: false,
    },
  ],
  USDC: [
    {
      id: 'usdc-erc20', name: 'Ethereum (ERC20)', shortName: 'ERC20',
      address: '0x71C8360f388742CE0808363A75990664b3d48F40',
      contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      minDeposit: 10, minWithdraw: 20, withdrawFee: 3.5,
      confirmations: 12, estimatedTime: '~5 min', isDefault: true,
    },
  ],
  SOL: [
    {
      id: 'sol-native', name: 'Solana', shortName: 'SOL',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      minDeposit: 0.01, minWithdraw: 0.1, withdrawFee: 0.01,
      confirmations: 32, estimatedTime: '~30 sec', isDefault: true,
    },
  ],
};

const INITIAL_COINS: WalletCoin[] = [
  {
    id: 'w-btc', symbol: 'BTC', name: 'Bitcoin',
    balance: 0.4285, locked: 0.08, inOrder: 0.15,
    available: 0.1985, usdRate: 68420, usdValue: 29318.00, change24h: 2.84,
    networks: NETWORK_ADDRESSES.BTC, iconColor: '#F7931A',
  },
  {
    id: 'w-eth', symbol: 'ETH', name: 'Ethereum',
    balance: 3.85, locked: 0, inOrder: 0,
    available: 3.85, usdRate: 3520, usdValue: 13552.00, change24h: -1.15,
    networks: NETWORK_ADDRESSES.ETH, iconColor: '#627EEA',
  },
  {
    id: 'w-bnb', symbol: 'BNB', name: 'BNB',
    balance: 12.45, locked: 0, inOrder: 0,
    available: 12.45, usdRate: 612.80, usdValue: 7629.36, change24h: 1.39,
    networks: NETWORK_ADDRESSES.BNB, iconColor: '#F3BA2F',
  },
  {
    id: 'w-trx', symbol: 'TRX', name: 'TRON',
    balance: 25000, locked: 0, inOrder: 0,
    available: 25000, usdRate: 0.1145, usdValue: 2862.50, change24h: 0.82,
    networks: NETWORK_ADDRESSES.TRX, iconColor: '#FF0013',
  },
  {
    id: 'w-usdt', symbol: 'USDT', name: 'Tether USD',
    balance: 18450, locked: 0, inOrder: 10125,
    available: 8325, usdRate: 1.00, usdValue: 18450.00, change24h: 0.02,
    networks: NETWORK_ADDRESSES.USDT, iconColor: '#26A17B',
  },
  {
    id: 'w-usdc', symbol: 'USDC', name: 'USD Coin',
    balance: 5200, locked: 0, inOrder: 0,
    available: 5200, usdRate: 1.00, usdValue: 5200.00, change24h: 0.01,
    networks: NETWORK_ADDRESSES.USDC, iconColor: '#2775CA',
  },
  {
    id: 'w-sol', symbol: 'SOL', name: 'Solana',
    balance: 45.2, locked: 0, inOrder: 0,
    available: 45.2, usdRate: 182.40, usdValue: 8244.48, change24h: 5.62,
    networks: NETWORK_ADDRESSES.SOL, iconColor: '#9945FF',
  },
];

const DEPOSIT_HISTORY: DepositRecord[] = [
  {
    id: 'dep-001', coin: 'USDT', network: 'Tron (TRC20)', amount: 5000, usdValue: 5000,
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    txHash: '8f7d9a2b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    status: 'completed', confirmations: 20, requiredConfirmations: 20,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86300000).toISOString(),
  },
  {
    id: 'dep-002', coin: 'BTC', network: 'Bitcoin', amount: 0.25, usdValue: 17105,
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    txHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    status: 'completed', confirmations: 6, requiredConfirmations: 2,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    completedAt: new Date(Date.now() - 172200000).toISOString(),
  },
  {
    id: 'dep-003', coin: 'ETH', network: 'Ethereum (ERC20)', amount: 1.5, usdValue: 5280,
    address: '0x71C8360f388742CE0808363A75990664b3d48F40',
    txHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    status: 'processing', confirmations: 8, requiredConfirmations: 12,
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'dep-004', coin: 'SOL', network: 'Solana', amount: 20, usdValue: 3648,
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    txHash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    status: 'pending', confirmations: 5, requiredConfirmations: 32,
    createdAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'dep-005', coin: 'USDT', network: 'Ethereum (ERC20)', amount: 2500, usdValue: 2500,
    address: '0x71C8360f388742CE0808363A75990664b3d48F40',
    txHash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    status: 'failed', confirmations: 0, requiredConfirmations: 12,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const WITHDRAWAL_HISTORY: WithdrawalRecord[] = [
  {
    id: 'wth-001', coin: 'USDT', network: 'Tron (TRC20)', amount: 3000, fee: 1,
    netAmount: 2999, usdValue: 3000, toAddress: 'TJYeasypxft5gWwXiRfbfgEhAkXn7q5nAp',
    txHash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    status: 'completed',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    completedAt: new Date(Date.now() - 431800000).toISOString(),
  },
  {
    id: 'wth-002', coin: 'ETH', network: 'Ethereum (ERC20)', amount: 0.5, fee: 0.0012,
    netAmount: 0.4988, usdValue: 1760, toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD09',
    txHash: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    status: 'completed',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    completedAt: new Date(Date.now() - 604500000).toISOString(),
  },
  {
    id: 'wth-003', coin: 'BTC', network: 'Bitcoin', amount: 0.05, fee: 0.00005,
    netAmount: 0.04995, usdValue: 3421, toAddress: 'bc1q42lja79elem0anu8q860g3ez9mycdhmek4y6e',
    txHash: '',
    status: 'pending',
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'wth-004', coin: 'USDC', network: 'Ethereum (ERC20)', amount: 1500, fee: 3.5,
    netAmount: 1496.5, usdValue: 1500, toAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    txHash: '',
    status: 'rejected',
    createdAt: new Date(Date.now() - 864000000).toISOString(),
    rejectionReason: 'Address not whitelisted. Please add this address to your withdrawal whitelist first.',
  },
];


// ──────── Service ────────

class ExchangeWalletService {
  private coins: WalletCoin[] = [...INITIAL_COINS];
  private deposits: DepositRecord[] = [...DEPOSIT_HISTORY];
  private withdrawals: WithdrawalRecord[] = [...WITHDRAWAL_HISTORY];

  public async getWalletSummary(): Promise<ExchangeWalletSummary> {
    const totalUsdValue = this.coins.reduce((s, c) => s + c.usdValue, 0);
    const totalAvailable = this.coins.reduce((s, c) => s + c.available * c.usdRate, 0);
    const totalLocked = this.coins.reduce((s, c) => s + c.locked * c.usdRate, 0);
    const totalInOrder = this.coins.reduce((s, c) => s + c.inOrder * c.usdRate, 0);
    const changePercent24h = this.coins.reduce((s, c) => s + c.change24h * (c.usdValue / totalUsdValue), 0);

    const res = await apiClient.mockDelay({
      totalUsdValue, totalAvailable, totalLocked, totalInOrder, coins: this.coins,
      changePercent24h: +changePercent24h.toFixed(2),
    }, 120);
    return res.data;
  }

  public async getCoin(symbol: string): Promise<WalletCoin | undefined> {
    const coin = this.coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    const res = await apiClient.mockDelay(coin, 50);
    return res.data;
  }

  public async getDepositAddress(symbol: string, networkId?: string): Promise<WalletNetwork | undefined> {
    const coin = this.coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    if (!coin) return undefined;
    const network = networkId
      ? coin.networks.find(n => n.id === networkId)
      : coin.networks.find(n => n.isDefault) || coin.networks[0];
    const res = await apiClient.mockDelay(network, 80);
    return res.data;
  }

  public async getDepositHistory(coin?: string): Promise<DepositRecord[]> {
    const filtered = coin
      ? this.deposits.filter(d => d.coin.toUpperCase() === coin.toUpperCase())
      : this.deposits;
    const res = await apiClient.mockDelay(filtered, 100);
    return res.data;
  }

  public async getWithdrawalHistory(coin?: string): Promise<WithdrawalRecord[]> {
    const filtered = coin
      ? this.withdrawals.filter(w => w.coin.toUpperCase() === coin.toUpperCase())
      : this.withdrawals;
    const res = await apiClient.mockDelay(filtered, 100);
    return res.data;
  }

  public async submitWithdrawal(params: {
    coin: string;
    networkId: string;
    address: string;
    amount: number;
  }): Promise<WithdrawalRecord> {
    const coinData = this.coins.find(c => c.symbol.toUpperCase() === params.coin.toUpperCase());
    if (!coinData) throw new Error(`Coin ${params.coin} not found`);

    const network = coinData.networks.find(n => n.id === params.networkId);
    if (!network) throw new Error('Invalid network selected');

    if (params.amount > coinData.available) {
      throw new Error(`Insufficient ${params.coin} balance. Available: ${coinData.available}`);
    }
    if (params.amount < network.minWithdraw) {
      throw new Error(`Minimum withdrawal is ${network.minWithdraw} ${params.coin}`);
    }
    if (!params.address || params.address.length < 10) {
      throw new Error('Invalid withdrawal address');
    }

    const netAmount = params.amount - network.withdrawFee;
    const record: WithdrawalRecord = {
      id: `wth-${Date.now()}`,
      coin: params.coin,
      network: network.name,
      amount: params.amount,
      fee: network.withdrawFee,
      netAmount,
      usdValue: +(params.amount * coinData.usdRate).toFixed(2),
      toAddress: params.address,
      txHash: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Deduct from available
    coinData.available -= params.amount;
    coinData.locked += params.amount;
    coinData.usdValue = coinData.balance * coinData.usdRate;

    this.withdrawals.unshift(record);
    const res = await apiClient.mockDelay(record, 300);
    return res.data;
  }

  // Simulate balance updates (polling)
  public async refreshBalances(): Promise<WalletCoin[]> {
    // Simulate small price movements
    this.coins = this.coins.map(c => {
      const drift = (Math.random() - 0.49) * c.usdRate * 0.0008;
      const newRate = +(c.usdRate + drift).toFixed(c.usdRate < 1 ? 4 : 2);
      return {
        ...c,
        usdRate: newRate,
        usdValue: +(c.balance * newRate).toFixed(2),
      };
    });

    const res = await apiClient.mockDelay(this.coins, 80);
    return res.data;
  }
}

export const exchangeWalletService = new ExchangeWalletService();
