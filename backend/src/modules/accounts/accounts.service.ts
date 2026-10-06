import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, TradingAccount, TradingAccountType, WalletType } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Exness-style trading account management.
 *
 * Design (keeps the trading engine untouched):
 * - The trading engine works against the user's USD Wallet of the active type
 *   (REAL / DEMO, selected via user.demoModeEnabled).
 * - For each type exactly one TradingAccount is "bound" (isActive = true). The
 *   bound account's live figures come from that wallet. Unbound accounts keep
 *   their balance in TradingAccount.balance.
 * - Switching to an unbound account parks the wallet balance in the previously
 *   bound account and loads the new account's balance into the wallet.
 * - The "current" account = the bound account whose type matches demo mode.
 *   Deposits / withdrawals / trades therefore always hit the current account.
 */
const PROVIDER_ID = 'TRADECORE';
const DEMO_START_BALANCE = 10000;

type AccountClass = 'STANDARD' | 'PRO' | 'RAW';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private walletTypeOf(type: TradingAccountType): WalletType {
    return type === 'DEMO' ? 'DEMO' : 'REAL';
  }

  private defaultServer(type: TradingAccountType) {
    return type === 'DEMO' ? 'TradeCore-Trial' : 'TradeCore-Real';
  }

  private async generateAccountNumber(tx: Prisma.TransactionClient) {
    for (let i = 0; i < 10; i++) {
      const candidate = String(Math.floor(10000000 + Math.random() * 89999999));
      const exists = await tx.tradingAccount.findUnique({ where: { accountNumber: candidate } });
      if (!exists) return candidate;
    }
    throw new BadRequestException('Could not allocate an account number, please retry');
  }

  private async ensureUsdWallet(tx: Prisma.TransactionClient, userId: string, type: WalletType) {
    const existing = await tx.wallet.findUnique({
      where: { userId_currency_type: { userId, currency: 'USD', type } },
    });
    if (existing) return existing;
    return tx.wallet.create({
      data: {
        userId,
        currency: 'USD',
        type,
        balance: type === 'DEMO' ? DEMO_START_BALANCE : 0,
        lockedBalance: 0,
      },
    });
  }

  /** Make sure the user has a bound Standard Real + Standard Demo account. */
  private async ensureDefaults(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      for (const type of ['LIVE', 'DEMO'] as TradingAccountType[]) {
        const bound = await tx.tradingAccount.findFirst({
          where: { userId, type, isActive: true, deletedAt: null },
        });
        if (bound) continue;
        await this.ensureUsdWallet(tx, userId, this.walletTypeOf(type));
        // Re-bind an existing non-archived account of that type if present
        const candidate = await tx.tradingAccount.findFirst({
          where: { userId, type, isArchived: false, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
        if (candidate) {
          await tx.tradingAccount.update({ where: { id: candidate.id }, data: { isActive: true } });
          continue;
        }
        const created = await tx.tradingAccount.create({
          data: {
            userId,
            providerId: PROVIDER_ID,
            accountNumber: await this.generateAccountNumber(tx),
            type,
            currency: 'USD',
            leverage: 2000,
            accountClass: 'STANDARD',
            name: type === 'DEMO' ? 'Standard Demo' : 'Standard Real',
            server: this.defaultServer(type),
            isActive: true,
          },
        });

        if (type === 'DEMO') {
          const btc = await tx.tradingPair.findFirst({ where: { symbol: 'BTCUSD', status: 'ACTIVE' } });
          const eur = await tx.tradingPair.findFirst({ where: { symbol: 'EURUSD', status: 'ACTIVE' } });

          if (btc) {
            // Seed a closed trade in history
            await tx.platformOrder.create({
              data: {
                userId,
                tradingPairId: btc.id,
                side: 'BUY',
                type: 'MARKET',
                status: 'FILLED',
                quantity: new Prisma.Decimal(1),
                filledQuantity: new Prisma.Decimal(1),
                remainingQuantity: new Prisma.Decimal(0),
                price: new Prisma.Decimal(59000),
                averagePrice: new Prisma.Decimal(59000),
                metadata: { isDemo: true, isCfd: true, isPosition: false } as any,
                createdAt: new Date(Date.now() - 86400000), // 1 day ago
              }
            });
            // Seed an active position
            await tx.platformOrder.create({
              data: {
                userId,
                tradingPairId: btc.id,
                side: 'BUY',
                type: 'MARKET',
                status: 'PENDING',
                quantity: new Prisma.Decimal(0.5),
                filledQuantity: new Prisma.Decimal(0),
                remainingQuantity: new Prisma.Decimal(0.5),
                price: new Prisma.Decimal(60500),
                averagePrice: null,
                metadata: { isDemo: true, isCfd: true, isPosition: true, takeProfit: 65000, stopLoss: 58000 } as any,
              }
            });
          }
          if (eur) {
            // Seed an active position
            await tx.platformOrder.create({
              data: {
                userId,
                tradingPairId: eur.id,
                side: 'SELL',
                type: 'MARKET',
                status: 'PENDING',
                quantity: new Prisma.Decimal(2),
                filledQuantity: new Prisma.Decimal(0),
                remainingQuantity: new Prisma.Decimal(2),
                price: new Prisma.Decimal(1.0850),
                averagePrice: null,
                metadata: { isDemo: true, isCfd: true, isPosition: true, takeProfit: 1.0700, stopLoss: 1.0950 } as any,
              }
            });
          }
        }
      }
    });
  }

  private async hasOpenExposure(userId: string, type: TradingAccountType) {
    const isDemo = type === 'DEMO';
    const openOrders = await this.prisma.platformOrder.count({
      where: {
        userId,
        status: { in: ['PENDING', 'PARTIALLY_FILLED'] },
        metadata: { path: ['isDemo'], equals: isDemo },
      },
    });
    return openOrders > 0;
  }

  /** Funds locked on a wallet by pending withdrawals (not trading margin). */
  private async pendingWithdrawalLocks(walletIds: string[]) {
    if (walletIds.length === 0) return new Map<string, number>();
    const rows = await this.prisma.withdrawal.groupBy({
      by: ['walletId'],
      where: { walletId: { in: walletIds }, status: 'PENDING' },
      _sum: { amount: true },
    });
    return new Map(rows.map((r) => [r.walletId, Number(r._sum.amount ?? 0)]));
  }

  private serialize(
    acc: TradingAccount,
    wallet: { id: string; balance: any; lockedBalance: any } | null,
    demoMode: boolean,
    withdrawalLocks: Map<string, number>,
  ) {
    const isCurrent = acc.isActive && !acc.isArchived && (acc.type === 'DEMO') === demoMode;
    let balance: number, margin: number, freeMargin: number;
    if (acc.isActive && wallet) {
      freeMargin = Number(wallet.balance);
      margin = Math.max(0, Number(wallet.lockedBalance) - (withdrawalLocks.get(wallet.id) || 0));
      balance = freeMargin + margin;
    } else {
      balance = Number(acc.balance);
      margin = 0;
      freeMargin = balance;
    }
    const equity = balance;
    return {
      id: acc.id,
      accountNumber: acc.accountNumber,
      name: acc.name || `${acc.accountClass === 'PRO' ? 'Pro' : acc.accountClass === 'RAW' ? 'Raw' : 'Standard'} ${acc.type === 'DEMO' ? 'Demo' : 'Real'}`,
      type: acc.type,
      accountClass: acc.accountClass,
      server: acc.server,
      currency: acc.currency,
      leverage: acc.leverage,
      balance,
      equity,
      margin,
      freeMargin,
      marginLevel: margin > 0 ? (equity / margin) * 100 : null,
      status: acc.isArchived ? 'ARCHIVED' : 'ACTIVE',
      isArchived: acc.isArchived,
      isBound: acc.isActive,
      isCurrent,
      createdAt: acc.createdAt,
    };
  }

  async list(userId: string, includeArchived = true) {
    await this.ensureDefaults(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const [accounts, wallets] = await Promise.all([
      this.prisma.tradingAccount.findMany({
        where: { userId, deletedAt: null, ...(includeArchived ? {} : { isArchived: false }) },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.wallet.findMany({ where: { userId, currency: 'USD' } }),
    ]);
    const locks = await this.pendingWithdrawalLocks(wallets.map((w) => w.id));
    return accounts.map((a) =>
      this.serialize(a, wallets.find((w) => w.type === this.walletTypeOf(a.type)) || null, user.demoModeEnabled, locks),
    );
  }

  async get(userId: string, id: string) {
    const all = await this.list(userId);
    const acc = all.find((a) => a.id === id);
    if (!acc) throw new NotFoundException('Account not found');
    return acc;
  }

  private async findOwned(userId: string, id: string) {
    const acc = await this.prisma.tradingAccount.findFirst({ where: { id, userId, deletedAt: null } });
    if (!acc) throw new NotFoundException('Account not found');
    return acc;
  }

  async create(
    userId: string,
    dto: { type: 'DEMO' | 'LIVE' | 'REAL'; accountClass?: AccountClass; leverage?: number; name?: string },
  ) {
    await this.ensureDefaults(userId);
    const type: TradingAccountType = dto.type === 'DEMO' ? 'DEMO' : 'LIVE';
    const accountClass: AccountClass = dto.accountClass === 'PRO' ? 'PRO' : dto.accountClass === 'RAW' ? 'RAW' : 'STANDARD';
    const allowedLeverage = [50, 100, 200, 500, 1000, 2000];
    const leverage = allowedLeverage.includes(Number(dto.leverage)) ? Number(dto.leverage) : 2000;
    const count = await this.prisma.tradingAccount.count({ where: { userId, deletedAt: null } });
    if (count >= 20) throw new BadRequestException('Maximum number of accounts reached');

    const created = await this.prisma.$transaction(async (tx) =>
      tx.tradingAccount.create({
        data: {
          userId,
          providerId: PROVIDER_ID,
          accountNumber: await this.generateAccountNumber(tx),
          type,
          currency: 'USD',
          leverage,
          accountClass,
          name: dto.name?.trim().slice(0, 40) || `${accountClass === 'PRO' ? 'Pro' : accountClass === 'RAW' ? 'Raw' : 'Standard'} ${type === 'DEMO' ? 'Demo' : 'Real'}`,
          server: this.defaultServer(type),
          balance: type === 'DEMO' ? DEMO_START_BALANCE : 0,
          equity: type === 'DEMO' ? DEMO_START_BALANCE : 0,
          freeMargin: type === 'DEMO' ? DEMO_START_BALANCE : 0,
          isActive: false,
        },
      }),
    );
    return this.get(userId, created.id);
  }

  async rename(userId: string, id: string, name: string) {
    const clean = (name || '').trim();
    if (!clean) throw new BadRequestException('Name is required');
    if (clean.length > 40) throw new BadRequestException('Name must be 40 characters or less');
    await this.findOwned(userId, id);
    await this.prisma.tradingAccount.update({ where: { id }, data: { name: clean } });
    return this.get(userId, id);
  }

  async archive(userId: string, id: string) {
    const acc = await this.findOwned(userId, id);
    if (acc.isArchived) throw new BadRequestException('Account is already archived');
    if (acc.isActive) {
      throw new BadRequestException('This account is linked to your active trading session. Switch to another account of the same type before archiving it.');
    }
    if (acc.type === 'LIVE' && Number(acc.balance) > 0) {
      throw new BadRequestException('Real accounts must have a zero balance before archiving. Transfer the funds first.');
    }
    await this.prisma.tradingAccount.update({ where: { id }, data: { isArchived: true } });
    return this.get(userId, id);
  }

  async restore(userId: string, id: string) {
    const acc = await this.findOwned(userId, id);
    if (!acc.isArchived) throw new BadRequestException('Account is not archived');
    await this.prisma.tradingAccount.update({ where: { id }, data: { isArchived: false } });
    return this.get(userId, id);
  }

  async switchAccount(userId: string, id: string) {
    await this.ensureDefaults(userId);
    const target = await this.findOwned(userId, id);
    if (target.isArchived) throw new BadRequestException('Archived accounts cannot be activated. Restore it first.');

    if (!target.isActive) {
      if (await this.hasOpenExposure(userId, target.type)) {
        throw new BadRequestException(
          'Close all open positions and pending orders on your current ' +
            (target.type === 'DEMO' ? 'demo' : 'real') + ' account before switching to another one.',
        );
      }
      await this.prisma.$transaction(async (tx) => {
        const walletType = this.walletTypeOf(target.type);
        const wallet = await this.ensureUsdWallet(tx, userId, walletType);
        const previous = await tx.tradingAccount.findFirst({
          where: { userId, type: target.type, isActive: true, deletedAt: null },
        });
        // No open orders at this point, so the only locked funds are pending withdrawals,
        // which stay on the wallet until an admin settles them.
        const parked = new Prisma.Decimal(wallet.balance);
        if (previous) {
          await tx.tradingAccount.update({
            where: { id: previous.id },
            data: { isActive: false, balance: parked, equity: parked, freeMargin: parked, margin: 0 },
          });
        }
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: target.balance },
        });
        await tx.tradingAccount.update({ where: { id: target.id }, data: { isActive: true } });
      });
    }

    const demoModeEnabled = target.type === 'DEMO';
    await this.prisma.user.update({ where: { id: userId }, data: { demoModeEnabled } });
    return { demoModeEnabled, account: await this.get(userId, id) };
  }

  async transfer(userId: string, dto: { fromAccountId: string; toAccountId: string; amount: number }) {
    const amount = Number(dto.amount);
    if (!amount || amount <= 0) throw new BadRequestException('Amount must be greater than zero');
    if (dto.fromAccountId === dto.toAccountId) throw new BadRequestException('Source and destination must be different');
    const from = await this.findOwned(userId, dto.fromAccountId);
    const to = await this.findOwned(userId, dto.toAccountId);
    if (from.type !== to.type) throw new BadRequestException('Transfers are only allowed between accounts of the same type (Real ↔ Real, Demo ↔ Demo)');
    if (from.isArchived || to.isArchived) throw new BadRequestException('Archived accounts cannot send or receive transfers');

    const amt = new Prisma.Decimal(amount);
    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureUsdWallet(tx, userId, this.walletTypeOf(from.type));

      // Debit source
      if (from.isActive) {
        if (new Prisma.Decimal(wallet.balance).lt(amt)) throw new BadRequestException('Insufficient free margin on source account');
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amt } } });
      } else {
        if (new Prisma.Decimal(from.balance).lt(amt)) throw new BadRequestException('Insufficient balance on source account');
        await tx.tradingAccount.update({
          where: { id: from.id },
          data: { balance: { decrement: amt }, equity: { decrement: amt }, freeMargin: { decrement: amt } },
        });
      }
      // Credit destination
      if (to.isActive) {
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amt } } });
      } else {
        await tx.tradingAccount.update({
          where: { id: to.id },
          data: { balance: { increment: amt }, equity: { increment: amt }, freeMargin: { increment: amt } },
        });
      }

      return tx.transaction.create({
        data: {
          reference: `ITF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          walletId: wallet.id,
          type: 'INTERNAL_TRANSFER',
          status: 'COMPLETED',
          amount: amt,
          currency: 'USD',
          fee: 0,
          netAmount: amt,
          metadata: {
            from: from.accountNumber,
            to: to.accountNumber,
            fromAccountId: from.id,
            toAccountId: to.id,
          },
        },
      });
    });

    return {
      success: true,
      transaction: result,
      message: `Transferred ${amount.toFixed(2)} USD from #${from.accountNumber} to #${to.accountNumber}`,
    };
  }

  /** Demo-only instant funding (Exness "Set balance" equivalent). Real accounts must use Deposit. */
  async demoTopUp(userId: string, id: string, amountRaw: number) {
    const amount = Number(amountRaw);
    if (!amount || amount <= 0 || amount > 1_000_000) throw new BadRequestException('Amount must be between 0 and 1,000,000');
    const acc = await this.findOwned(userId, id);
    if (acc.type !== 'DEMO') throw new BadRequestException('Instant top-up is only available for demo accounts');
    if (acc.isArchived) throw new BadRequestException('Archived accounts cannot be funded');
    const amt = new Prisma.Decimal(amount);
    await this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureUsdWallet(tx, userId, 'DEMO');
      if (acc.isActive) {
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amt } } });
      } else {
        await tx.tradingAccount.update({
          where: { id: acc.id },
          data: { balance: { increment: amt }, equity: { increment: amt }, freeMargin: { increment: amt } },
        });
      }
      const dep = await tx.deposit.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: amt,
          currency: 'USD',
          paymentMethod: 'DEMO_TOPUP',
          reference: `DEMO-${acc.accountNumber}-${Date.now()}`,
          status: 'APPROVED',
        },
      });
      await tx.transaction.create({
        data: {
          reference: `DEP-${dep.id}`,
          walletId: wallet.id,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount: amt,
          currency: 'USD',
          fee: 0,
          netAmount: amt,
          metadata: { accountId: acc.id, accountNumber: acc.accountNumber, demoTopUp: true },
        },
      });
    });
    return this.get(userId, id);
  }
}
