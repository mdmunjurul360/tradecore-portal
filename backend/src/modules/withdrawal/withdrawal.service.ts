import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { GetWithdrawalsFilterDto } from './dto/get-withdrawals-filter.dto';

@Injectable()
export class WithdrawalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService
  ) {}

  async createWithdrawal(userId: string, createWithdrawalDto: CreateWithdrawalDto) {
    const { amount, currency, withdrawalMethod, destination, note } = createWithdrawalDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const expectedType = user?.demoModeEnabled ? 'DEMO' : 'REAL';

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_currency_type: {
          userId,
          currency,
          type: expectedType,
        },
      },
    });

    if (!wallet) {
      throw new BadRequestException(`Wallet for currency ${currency} not found`);
    }

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Treat withdrawalMethod as network symbol for blockchain validation
    // E.g., TRC20, ERC20, BTC
    try {
      const isValidAddress = await this.blockchainService.validateAddress(destination, withdrawalMethod);
      if (!isValidAddress) {
        throw new BadRequestException(`Invalid address for network ${withdrawalMethod}`);
      }
    } catch (e) {
      // If validation fails or network doesn't exist, we assume it's invalid or we log it
      throw new BadRequestException(e.message || `Address validation failed`);
    }

    const networkFee = 0.0001; // Mock standard fee for this test, should be calculated

    // Perform transaction: Lock the funds and create the withdrawal record
    const withdrawal = await this.prisma.$transaction(async (tx) => {
      // Lock balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          lockedBalance: { increment: amount },
        },
      });

      return tx.withdrawal.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          currency,
          withdrawalMethod,
          destination,
          note,
          status: 'PENDING',
          networkFee,
        },
      });
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
