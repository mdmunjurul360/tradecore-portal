import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { GetTransactionsFilterDto } from './dto/get-transactions-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filterDto: GetTransactionsFilterDto, isDemoMode = false) {
    const { type, status, page = 1, limit = 10 } = filterDto;
    
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      wallet: {
        userId,
        type: isDemoMode ? 'DEMO' : 'REAL',
      },
      ...(type && { type }),
      ...(status && { status }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string, isDemoMode = false) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        wallet: {
          userId,
          type: isDemoMode ? 'DEMO' : 'REAL',
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }
}
