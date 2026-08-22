import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findFirst({
      where: { userId, currency: 'USD' },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          currency: 'USD',
          balance: 0.0000,
        },
      });
    }

    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getWallet(userId);
    return {
      currency: wallet.currency,
      balance: wallet.balance,
      isLocked: wallet.isLocked,
    };
  }
}
