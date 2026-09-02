import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AdminGetWithdrawalsFilterDto } from './dto/admin-get-withdrawals-filter.dto';
import { WalletLedgerService } from '../wallet-ledger/wallet-ledger.service';
import { NotificationService } from '../notification/notification.service';
import { TransactionType } from '@prisma/client';
import { NotificationType as NotificationTypeEnum } from '../notification/dto/create-notification.dto';

@Injectable()
export class AdminWithdrawalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletLedger: WalletLedgerService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(filterDto: AdminGetWithdrawalsFilterDto) {
    const { status, userId, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
    };

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
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
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      data: withdrawals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
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

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    return withdrawal;
  }

  async approve(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException(
        `Withdrawal is already ${withdrawal.status}. Only PENDING withdrawals can be approved.`,
      );
    }

    // 2. Validate the wallet belongs to the withdrawal owner.
    if (withdrawal.wallet.userId !== withdrawal.userId) {
      throw new BadRequestException('Wallet owner mismatch.');
    }

    // 3. Validate sufficient wallet balance.
    if (withdrawal.wallet.balance.lt(withdrawal.amount)) {
      throw new BadRequestException('Insufficient wallet balance to approve this withdrawal.');
    }

    // 4. Execute everything inside ONE Prisma transaction.
    return this.prisma.$transaction(async (tx) => {
      // 8. Update Withdrawal status to APPROVED.
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // 5. Debit the wallet using WalletLedgerService.debitWallet().
      // (6 and 7 are done inside debitWallet)
      await this.walletLedger.debitWallet(
        {
          walletId: withdrawal.walletId,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          type: TransactionType.WITHDRAWAL,
          reference: `WD-${withdrawal.id}`,
          description: 'Withdrawal approved',
          metadata: { 
            withdrawalId: withdrawal.id, 
            withdrawalMethod: withdrawal.withdrawalMethod,
            destination: withdrawal.destination 
          },
        },
        tx,
      );

      // 9. Create an in-app notification.
      await this.notificationService.createNotification(withdrawal.userId, {
        type: NotificationTypeEnum.IN_APP,
        title: 'Withdrawal Approved',
        message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been approved and processed.`,
        metadata: { withdrawalId: withdrawal.id },
      });

      return updatedWithdrawal;
    });
  }

  async reject(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException(
        `Withdrawal is already ${withdrawal.status}. Only PENDING withdrawals can be rejected.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await this.notificationService.createNotification(withdrawal.userId, {
        type: NotificationTypeEnum.IN_APP,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} was rejected. Please contact support if you have questions.`,
        metadata: { withdrawalId: withdrawal.id },
      });

      return updatedWithdrawal;
    });
  }
}
