import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { GetPortfolioFilterDto } from './dto/get-portfolio-filter.dto';
import { PortfolioSummaryDto } from './dto/portfolio-summary.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filterDto: GetPortfolioFilterDto) {
    const { asset, search, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.PortfolioHoldingWhereInput = {
      userId,
      ...(asset && { asset: asset.toUpperCase() }),
      ...(search && {
        asset: { contains: search.toUpperCase(), mode: 'insensitive' as const },
      }),
    };

    const [holdings, total] = await Promise.all([
      this.prisma.portfolioHolding.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.portfolioHolding.count({ where }),
    ]);

    return {
      data: holdings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSummary(userId: string): Promise<PortfolioSummaryDto> {
    const holdings = await this.prisma.portfolioHolding.findMany({
      where: { userId },
    });

    let totalValue = 0;
    let totalUnrealizedPnL = 0;
    let totalRealizedPnL = 0;
    let totalCost = 0;

    // Placeholder for current prices - in a real app, you'd fetch this from a price feed service or cache
    // We'll just assume averageBuyPrice is the current price for now as a placeholder for unrealized P/L
    for (const holding of holdings) {
      const qty = Number(holding.quantity);
      const cost = Number(holding.totalCost);
      const realized = Number(holding.realizedPnL);
      const avgPrice = Number(holding.averageBuyPrice);
      
      const currentValue = qty * avgPrice; // Placeholder logic
      const unrealized = currentValue - cost;

      totalValue += currentValue;
      totalUnrealizedPnL += unrealized;
      totalRealizedPnL += realized;
      totalCost += cost;
    }

    return {
      totalValue,
      totalUnrealizedPnL,
      totalRealizedPnL,
      totalCost,
    };
  }

  async findByAsset(userId: string, asset: string) {
    const holding = await this.prisma.portfolioHolding.findUnique({
      where: {
        userId_asset: {
          userId,
          asset: asset.toUpperCase(),
        },
      },
    });

    if (!holding) {
      throw new NotFoundException(`No holding found for asset ${asset.toUpperCase()}`);
    }

    return holding;
  }

  /**
   * Locks asset quantity in a user's portfolio holding (e.g. when placing a SELL order).
   * Moves amount from quantity to lockedQuantity atomically.
   */
  async lockAsset(
    params: {
      userId: string;
      asset: string;
      quantity: number | string | Prisma.Decimal;
    },
    txClient?: Prisma.TransactionClient,
  ) {
    const qtyDec = new Prisma.Decimal(params.quantity);
    if (qtyDec.lte(0)) {
      throw new BadRequestException('Lock quantity must be strictly positive');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      const holding = await tx.portfolioHolding.findUnique({
        where: {
          userId_asset: {
            userId: params.userId,
            asset: params.asset.toUpperCase(),
          },
        },
      });

      if (!holding) {
        throw new BadRequestException(
          `Portfolio holding not found for asset ${params.asset.toUpperCase()}`,
        );
      }

      if (holding.quantity.lt(qtyDec)) {
        throw new BadRequestException(
          `Insufficient available balance in ${params.asset.toUpperCase()} holding. Available: ${holding.quantity}, Required: ${qtyDec}`,
        );
      }

      return tx.portfolioHolding.update({
        where: { id: holding.id },
        data: {
          quantity: holding.quantity.minus(qtyDec),
          lockedQuantity: holding.lockedQuantity.plus(qtyDec),
        },
      });
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }

  /**
   * Unlocks asset quantity in a user's portfolio holding (e.g. when cancelling a SELL order).
   * Moves amount from lockedQuantity back to quantity atomically.
   */
  async unlockAsset(
    params: {
      userId: string;
      asset: string;
      quantity: number | string | Prisma.Decimal;
    },
    txClient?: Prisma.TransactionClient,
  ) {
    const qtyDec = new Prisma.Decimal(params.quantity);
    if (qtyDec.lte(0)) {
      throw new BadRequestException('Unlock quantity must be strictly positive');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      const holding = await tx.portfolioHolding.findUnique({
        where: {
          userId_asset: {
            userId: params.userId,
            asset: params.asset.toUpperCase(),
          },
        },
      });

      if (!holding) {
        throw new BadRequestException(
          `Portfolio holding not found for asset ${params.asset.toUpperCase()}`,
        );
      }

      if (holding.lockedQuantity.lt(qtyDec)) {
        throw new BadRequestException(
          `Cannot unlock more than currently locked. Locked: ${holding.lockedQuantity}, Requested: ${qtyDec}`,
        );
      }

      return tx.portfolioHolding.update({
        where: { id: holding.id },
        data: {
          quantity: holding.quantity.plus(qtyDec),
          lockedQuantity: holding.lockedQuantity.minus(qtyDec),
        },
      });
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }

  /**
   * Settles previously locked asset quantity in a user's portfolio holding (e.g. when a SELL order is filled).
   * Deducts quantity directly from lockedQuantity without affecting available balance.
   */
  async settleAsset(
    params: {
      userId: string;
      asset: string;
      quantity: number | string | Prisma.Decimal;
    },
    txClient?: Prisma.TransactionClient,
  ) {
    const qtyDec = new Prisma.Decimal(params.quantity);
    if (qtyDec.lte(0)) {
      throw new BadRequestException('Settle quantity must be strictly positive');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      const holding = await tx.portfolioHolding.findUnique({
        where: {
          userId_asset: {
            userId: params.userId,
            asset: params.asset.toUpperCase(),
          },
        },
      });

      if (!holding) {
        throw new BadRequestException(
          `Portfolio holding not found for asset ${params.asset.toUpperCase()}`,
        );
      }

      if (holding.lockedQuantity.lt(qtyDec)) {
        throw new BadRequestException(
          `Insufficient locked quantity for settlement. Locked: ${holding.lockedQuantity}, Settle: ${qtyDec}`,
        );
      }

      return tx.portfolioHolding.update({
        where: { id: holding.id },
        data: {
          lockedQuantity: holding.lockedQuantity.minus(qtyDec),
        },
      });
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }
}
