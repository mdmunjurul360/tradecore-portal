import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { GetWithdrawalsFilterDto } from './dto/get-withdrawals-filter.dto';

@Injectable()
export class WithdrawalService {
  constructor(private readonly prisma: PrismaService) {}

  async createWithdrawal(userId: string, createWithdrawalDto: CreateWithdrawalDto) {
    const { amount, currency, withdrawalMethod, destination, note } = createWithdrawalDto;

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    if (!wallet) {
      throw new BadRequestException(`Wallet for currency ${currency} not found`);
    }

    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        currency,
        withdrawalMethod,
        destination,
        note,
        status: 'PENDING',
      },
    });

    return withdrawal;
  }

  async findAll(userId: string, filterDto: GetWithdrawalsFilterDto) {
    const { status, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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

  async findOne(userId: string, id: string) {
    const withdrawal = await this.prisma.withdrawal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    return withdrawal;
  }
}
