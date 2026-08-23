import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { GetLedgerFilterDto } from './dto/get-ledger-filter.dto';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filterDto: GetLedgerFilterDto) {
    const { direction, currency, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    // Get all wallet IDs belonging to this user to scope ledger entries
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      select: { id: true },
    });

    const walletIds = wallets.map((w) => w.id);

    const where = {
      accountId: { in: walletIds },
      ...(direction && { direction }),
      ...(currency && { currency }),
    };

    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    // Get all wallet IDs belonging to this user
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      select: { id: true },
    });

    const walletIds = wallets.map((w) => w.id);

    const entry = await this.prisma.ledgerEntry.findFirst({
      where: {
        id,
        accountId: { in: walletIds },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Ledger entry with ID ${id} not found`);
    }

    return entry;
  }
}
