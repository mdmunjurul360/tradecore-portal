import { Injectable, NotFoundException } from '@nestjs/common';
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
}
