import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AdminGetDepositsFilterDto } from './dto/admin-get-deposits-filter.dto';
import { WalletLedgerService } from '../wallet-ledger/wallet-ledger.service';
import { NotificationService } from '../notification/notification.service';
import { TransactionType } from '@prisma/client';
import { NotificationType } from '../notification/dto/create-notification.dto';

@Injectable()
export class AdminDepositService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletLedger: WalletLedgerService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(filterDto: AdminGetDepositsFilterDto) {
    const { status, userId, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
    };

    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return {
      data: deposits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }

    return deposit;
  }

  async approve(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }

    if (deposit.status !== 'PENDING') {
      throw new BadRequestException(
        `Deposit is already ${deposit.status}. Only PENDING deposits can be approved.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // 2. Credit the user's wallet
      await this.walletLedger.creditWallet(
        {
          walletId: deposit.walletId,
          amount: deposit.amount,
          currency: deposit.currency,
          type: TransactionType.DEPOSIT,
          reference: deposit.reference || `DEP-${deposit.id}`,
          description: 'Deposit approved',
          metadata: { depositId: deposit.id, paymentMethod: deposit.paymentMethod },
        },
        tx,
      );

      // 3. Send notification
      await this.notificationService.createNotification(deposit.userId, {
        type: NotificationType.IN_APP,
        title: 'Deposit Approved',
        message: `Your deposit of ${deposit.amount} ${deposit.currency} has been approved and credited to your wallet.`,
        metadata: { depositId: deposit.id },
      });

      return updatedDeposit;
    });
  }

  async reject(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }

    if (deposit.status !== 'PENDING') {
      throw new BadRequestException(
        `Deposit is already ${deposit.status}. Only PENDING deposits can be rejected.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await this.notificationService.createNotification(deposit.userId, {
        type: NotificationType.IN_APP,
        title: 'Deposit Rejected',
        message: `Your deposit of ${deposit.amount} ${deposit.currency} was rejected. Please contact support if you have questions.`,
        metadata: { depositId: deposit.id },
      });

      return updatedDeposit;
    });
  }
}
