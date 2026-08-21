import { WalletAsset } from '../../types';
import { apiClient } from '../api/client';

const INITIAL_ASSETS: WalletAsset[] = [
  {
    id: 'w-usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    icon: 'Coins',
    balance: 18450.00,
    usdRate: 1.00,
    usdValue: 18450.00,
    change24h: 0.02,
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    network: 'TRON (TRC20)',
    decimals: 2,
  },
  {
    id: 'w-btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: 'Bitcoin',
    balance: 0.4285,
    usdRate: 68420.00,
    usdValue: 29318.00,
    change24h: 2.84,
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'Bitcoin Native SegWit',
    decimals: 6,
  },
  {
    id: 'w-eth',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Coins',
    balance: 3.8500,
    usdRate: 3520.00,
    usdValue: 13552.00,
    change24h: -1.15,
    address: '0x71C8360f388742CE0808363A75990664b3d48F40',
    network: 'Ethereum (ERC20)',
    decimals: 4,
  },
  {
    id: 'w-usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: 'Coins',
    balance: 5200.00,
    usdRate: 1.00,
    usdValue: 5200.00,
    change24h: 0.01,
    address: '0x71C8360f388742CE0808363A75990664b3d48F40',
    network: 'Ethereum (ERC20)',
    decimals: 2,
  },
  {
    id: 'w-sol',
    symbol: 'SOL',
    name: 'Solana',
    icon: 'Coins',
    balance: 45.20,
    usdRate: 182.40,
    usdValue: 8244.48,
    change24h: 5.62,
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    network: 'Solana Network',
    decimals: 3,
  }
];

class WalletService {
  private assets: WalletAsset[] = INITIAL_ASSETS;

  public async getAssets(): Promise<WalletAsset[]> {
    const res = await apiClient.mockDelay(this.assets, 160);
    return res.data;
  }

  public async getWallet(): Promise<{ totalUsdValue: number; balances: { currency: string; amount: number; usdValue: number; network: string; address: string }[] }> {
    const totalUsdValue = this.getTotalBalanceUSD();
    const balances = this.assets.map(a => ({
      currency: a.symbol,
      amount: a.balance,
      usdValue: a.usdValue,
      network: a.network,
      address: a.address,
    }));
    const res = await apiClient.mockDelay({ totalUsdValue, balances }, 150);
    return res.data;
  }

  public async swapCurrency(from: string, to: string, amount: number): Promise<boolean> {
    const fromAsset = this.assets.find(a => a.symbol.toUpperCase() === from.toUpperCase());
    const toAsset = this.assets.find(a => a.symbol.toUpperCase() === to.toUpperCase());
    if (!fromAsset || fromAsset.balance < amount) throw new Error(`Insufficient ${from} balance`);
    if (!toAsset) throw new Error(`Target asset ${to} not found`);

    fromAsset.balance -= amount;
    fromAsset.usdValue = fromAsset.balance * fromAsset.usdRate;

    const usdAmount = amount * fromAsset.usdRate;
    const toGained = usdAmount / toAsset.usdRate;
    toAsset.balance += toGained;
    toAsset.usdValue = toAsset.balance * toAsset.usdRate;

    await apiClient.mockDelay(true, 250);
    return true;
  }

  public async getAsset(symbol: string): Promise<WalletAsset | undefined> {
    return this.assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
  }

  public getTotalBalanceUSD(): number {
    return this.assets.reduce((sum, a) => sum + a.usdValue, 0);
  }

  public async transferToTradingAccount(assetId: string, amount: number, _targetAccountId: string): Promise<boolean> {
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset || asset.balance < amount) throw new Error('Insufficient wallet balance');

    asset.balance -= amount;
    asset.usdValue = asset.balance * asset.usdRate;
    return true;
  }
}

export const walletService = new WalletService();
