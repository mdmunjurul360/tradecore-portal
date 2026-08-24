import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AdminGetDepositsFilterDto } from './dto/admin-get-deposits-filter.dto';

@Injectable()
export class AdminDepositService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.deposit.update({
      where: { id },
      data: { status: 'APPROVED' },
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

    return this.prisma.deposit.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }
}
