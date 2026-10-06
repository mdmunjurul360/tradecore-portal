import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService
  ) {}

  async getWallet(userId: string) {
    const supportedAssets = ['USD', 'BTC', 'ETH', 'USDT', 'TRX', 'BNB', 'SOL', 'XRP'];
    
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const expectedType = user.demoModeEnabled ? 'DEMO' : 'REAL';

    let wallets = await this.prisma.wallet.findMany({
      where: { userId, type: expectedType },
    });

    const existingAssets = wallets.map(w => w.currency);
    const missingAssets = supportedAssets.filter(asset => !existingAssets.includes(asset));

    if (missingAssets.length > 0) {
      const newWalletsData = missingAssets.map(asset => {
        let defaultBalance = 0.0000;
        if (expectedType === 'DEMO') {
          if (asset === 'USD') defaultBalance = 10000.00;
          if (asset === 'USDT') defaultBalance = 10000.00;
          if (asset === 'BTC') defaultBalance = 1.00;
          if (asset === 'ETH') defaultBalance = 10.00;
        }
        return {
          userId,
          currency: asset,
          type: expectedType,
          balance: defaultBalance,
          lockedBalance: 0.0000,
        };
      });

      await this.prisma.wallet.createMany({
        data: newWalletsData as any,
      });

      wallets = await this.prisma.wallet.findMany({
        where: { userId, type: expectedType },
      });
    }

    // Ensure crypto addresses exist (non-blocking)
    this.ensureWalletAddresses(userId).catch(err =>
      this.logger.error(`Background address generation failed: ${err.message}`)
    );

    return wallets;
  }

  private async ensureWalletAddresses(userId: string) {
    const networks = await this.prisma.network.findMany({ where: { isActive: true } });
    const userAddresses = await this.prisma.walletAddress.findMany({ where: { userId } });
    
    const existingNetworkIds = userAddresses.map(a => a.networkId);
    
    for (const network of networks) {
      if (!existingNetworkIds.includes(network.id)) {
        try {
          const { address, privateKeyEncrypted } = await this.blockchainService.generateWallet(network.id);
          await this.prisma.walletAddress.create({
            data: {
              userId,
              networkId: network.id,
              address,
              privateKeyEncrypted,
            },
          });
          this.logger.debug(`Generated ${network.symbol} wallet address for user ${userId}`);
        } catch (error) {
          this.logger.error(`Failed to generate ${network.symbol} wallet address for user ${userId}`, error);
        }
      }
    }
  }

  async getBalance(userId: string) {
    const wallets = await this.getWallet(userId);
    return wallets.map(wallet => ({
      currency: wallet.currency,
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      isLocked: wallet.isLocked,
    }));
  }

  async getWalletBySymbol(userId: string, symbol: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const expectedType = user?.demoModeEnabled ? 'DEMO' : 'REAL';

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency_type: { userId, currency: symbol, type: expectedType } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async getNetworks() {
    return this.prisma.network.findMany({ where: { isActive: true } });
  }

  async getWalletAddress(userId: string, symbol: string) {
    // First try to find by symbol
    let network = await this.prisma.network.findUnique({ where: { symbol } });
    
    // If not found, try by name
    if (!network) {
      network = await this.prisma.network.findFirst({ 
        where: { name: { contains: symbol, mode: 'insensitive' } }
      });
    }
    
    if (!network) throw new NotFoundException(`Network ${symbol} not found`);
    
    let address = await this.prisma.walletAddress.findUnique({
      where: { userId_networkId: { userId, networkId: network.id } },
    });
    
    if (!address) {
      // Generate on demand
      try {
        const { address: newAddr, privateKeyEncrypted } = await this.blockchainService.generateWallet(network.id);
        address = await this.prisma.walletAddress.create({
          data: {
            userId,
            networkId: network.id,
            address: newAddr,
            privateKeyEncrypted,
          },
        });
      } catch (error) {
        this.logger.error(`Failed to generate wallet address: ${error.message}`);
        throw new BadRequestException('Failed to generate deposit address. Please try again.');
      }
    }

    return {
      address: address.address,
      network: network.name,
      symbol: network.symbol,
      explorerUrl: network.explorerUrl,
    };
  }

  async getHistory(userId: string, options?: { page?: number; limit?: number; type?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const deposits = await this.prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { wallet: true },
    });

    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { wallet: true },
    });

    // Get internal transfers from Transaction table
    const transfers = await this.prisma.transaction.findMany({
      where: {
        wallet: { userId },
        type: 'INTERNAL_TRANSFER',
      },
      orderBy: { createdAt: 'desc' },
      include: { wallet: true },
    });

    let history = [
      ...deposits.map(d => ({ id: d.id, type: 'DEPOSIT' as const, currency: d.currency, amount: d.amount, status: d.status, createdAt: d.createdAt, destination: null, txHash: d.txHash })),
      ...withdrawals.map(w => ({ id: w.id, type: 'WITHDRAWAL' as const, currency: w.currency, amount: w.amount, status: w.status, createdAt: w.createdAt, destination: w.destination, txHash: w.txHash })),
      ...transfers.map(t => ({ id: t.id, type: 'TRANSFER' as const, currency: t.currency, amount: t.amount, status: t.status, createdAt: t.createdAt, destination: null, txHash: null })),
    ];

    // Filter by type if specified
    if (options?.type && options.type !== 'ALL') {
      history = history.filter(h => h.type === options.type);
    }

    // Sort by date
    history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = history.length;
    const paginated = history.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async createWithdrawal(userId: string, data: { symbol: string; amount: number; destination: string; network?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const expectedType = user?.demoModeEnabled ? 'DEMO' : 'REAL';

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency_type: { userId, currency: data.symbol, type: expectedType } },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.isLocked) throw new BadRequestException('Wallet is locked');
    if (Number(wallet.balance) < data.amount) throw new BadRequestException('Insufficient balance');
    if (data.amount <= 0) throw new BadRequestException('Amount must be greater than zero');
    if (!data.destination || data.destination.length < 10) throw new BadRequestException('Invalid destination address');

    // Atomic: deduct balance, lock funds, create withdrawal record
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: data.amount },
          lockedBalance: { increment: data.amount },
        },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: data.amount,
          currency: data.symbol,
          withdrawalMethod: 'CRYPTO',
          destination: data.destination,
          status: 'PENDING',
        },
      });

      // Create ledger transaction
      await tx.transaction.create({
        data: {
          reference: `WD-${withdrawal.id}`,
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount: data.amount,
          currency: data.symbol,
          fee: 0,
          netAmount: data.amount,
        },
      });

      return withdrawal;
    });

    return result;
  }

  async transfer(userId: string, data: { currency: string; amount: number; from: string; to: string }) {
    if (data.amount <= 0) throw new BadRequestException('Amount must be greater than zero');
    if (data.from === data.to) throw new BadRequestException('Source and destination wallets must be different');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const expectedType = user?.demoModeEnabled ? 'DEMO' : 'REAL';

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency_type: { userId, currency: data.currency, type: expectedType } },
    });

    if (!wallet) throw new NotFoundException(`${data.currency} wallet not found`);
    if (wallet.isLocked) throw new BadRequestException('Wallet is locked');
    if (Number(wallet.balance) < data.amount) throw new BadRequestException('Insufficient balance');

    // For now we use a single wallet per currency. The transfer is recorded as a ledger entry.
    // In a full implementation, there would be separate funding/trading wallets.
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          reference: `TF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          walletId: wallet.id,
          type: 'INTERNAL_TRANSFER',
          status: 'COMPLETED',
          amount: data.amount,
          currency: data.currency,
          fee: 0,
          netAmount: data.amount,
          metadata: {
            from: data.from,
            to: data.to,
          },
        },
      });

      return transaction;
    });

    return {
      success: true,
      transaction: result,
      message: `Successfully transferred ${data.amount} ${data.currency} from ${data.from} to ${data.to}`,
    };
  }
}
