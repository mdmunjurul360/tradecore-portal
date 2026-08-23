import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { GetDepositsFilterDto } from './dto/get-deposits-filter.dto';

@Injectable()
export class DepositService {
  constructor(private readonly prisma: PrismaService) {}

  async createDeposit(userId: string, createDepositDto: CreateDepositDto) {
    const { amount, currency, paymentMethod, reference } = createDepositDto;

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

    if (reference) {
      const existingRef = await this.prisma.deposit.findUnique({
        where: { reference },
      });
      if (existingRef) {
        throw new BadRequestException('Transaction reference already exists');
      }
    }

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        currency,
        paymentMethod,
        reference,
        status: 'PENDING',
      },
    });

    return deposit;
  }

  async findAll(userId: string, filterDto: GetDepositsFilterDto) {
    const { status, page = 1, limit = 10 } = filterDto;
    
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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

  async findOne(userId: string, id: string) {
    const deposit = await this.prisma.deposit.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }

    return deposit;
  }
}
