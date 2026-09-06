import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { WalletLedgerService } from '../wallet-ledger/wallet-ledger.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { GetOrderFilterDto } from './dto/get-order-filter.dto';
import { Prisma, OrderType, OrderSide, PlatformOrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletLedgerService: WalletLedgerService,
    private readonly portfolioService: PortfolioService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate trading pair exists and is active
      const tradingPair = await tx.tradingPair.findUnique({
        where: { id: dto.tradingPairId },
      });

      if (!tradingPair) {
        throw new NotFoundException(`Trading pair with ID ${dto.tradingPairId} not found`);
      }

      if (!tradingPair.isActive || tradingPair.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Trading pair ${tradingPair.symbol} is currently not available for trading`,
        );
      }

      // 2. Validate quantity against trading pair constraints
      const quantity = new Prisma.Decimal(dto.quantity);

      if (quantity.lt(tradingPair.minOrderSize)) {
        throw new BadRequestException(
          `Order quantity ${dto.quantity} is below the minimum order size of ${tradingPair.minOrderSize}`,
        );
      }

      if (quantity.gt(tradingPair.maxOrderSize)) {
        throw new BadRequestException(
          `Order quantity ${dto.quantity} exceeds the maximum order size of ${tradingPair.maxOrderSize}`,
        );
      }

      // 3. Validate price for LIMIT orders
      if (dto.type === OrderType.LIMIT && (dto.price === undefined || dto.price === null)) {
        throw new BadRequestException('Price is required for LIMIT orders');
      }

      if (dto.price !== undefined && dto.price <= 0) {
        throw new BadRequestException('Price must be greater than zero');
      }

      // 4. Lock required balance or asset based on order side
      if (dto.side === OrderSide.BUY) {
        // Buy order locks quote asset from Wallet (fiat/quote)
        if (dto.price === undefined || dto.price === null) {
          throw new BadRequestException('Price or estimated price is required to lock quote funds for BUY orders');
        }
        const totalQuoteCost = quantity.mul(new Prisma.Decimal(dto.price));
        await this.walletLedgerService.lockWalletFunds(
          {
            userId,
            currency: tradingPair.quoteAsset,
            amount: totalQuoteCost,
          },
          tx,
        );
      } else if (dto.side === OrderSide.SELL) {
        // Sell order locks base asset from PortfolioHolding
        await this.portfolioService.lockAsset(
          {
            userId,
            asset: tradingPair.baseAsset,
            quantity,
          },
          tx,
        );
      }

      // 5. Create the order
      return tx.platformOrder.create({
        data: {
          userId,
          tradingPairId: dto.tradingPairId,
          side: dto.side,
          type: dto.type,
          status: PlatformOrderStatus.PENDING,
          quantity,
          filledQuantity: 0,
          remainingQuantity: quantity,
          price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : null,
          averagePrice: null,
        },
        include: {
          tradingPair: {
            select: {
              symbol: true,
              baseAsset: true,
              quoteAsset: true,
            },
          },
        },
      });
    });
  }

  async findAll(userId: string, filterDto: GetOrderFilterDto) {
    const { status, side, type, tradingPairId, search, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    const where: Prisma.PlatformOrderWhereInput = {
      userId,
      ...(status && { status }),
      ...(side && { side }),
      ...(type && { type }),
      ...(tradingPairId && { tradingPairId }),
      ...(search && {
        tradingPair: {
          symbol: { contains: search.toUpperCase(), mode: 'insensitive' as const },
        },
      }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.platformOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tradingPair: {
            select: {
              symbol: true,
              baseAsset: true,
              quoteAsset: true,
            },
          },
        },
      }),
      this.prisma.platformOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.platformOrder.findFirst({
      where: { id, userId },
      include: {
        tradingPair: {
          select: {
            symbol: true,
            baseAsset: true,
            quoteAsset: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async cancel(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.platformOrder.findFirst({
        where: { id, userId },
        include: {
          tradingPair: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (
        order.status !== PlatformOrderStatus.PENDING &&
        order.status !== PlatformOrderStatus.PARTIALLY_FILLED
      ) {
        throw new BadRequestException(
          `Order is already ${order.status}. Only PENDING or PARTIALLY_FILLED orders can be cancelled.`,
        );
      }

      // Unlock funds for remaining quantity
      const remainingQty = new Prisma.Decimal(order.remainingQuantity);
      if (remainingQty.gt(0)) {
        if (order.side === OrderSide.BUY) {
          if (order.price) {
            const unlockAmount = remainingQty.mul(order.price);
            await this.walletLedgerService.unlockWalletFunds(
              {
                userId,
                currency: order.tradingPair.quoteAsset,
                amount: unlockAmount,
              },
              tx,
            );
          }
        } else if (order.side === OrderSide.SELL) {
          await this.portfolioService.unlockAsset(
            {
              userId,
              asset: order.tradingPair.baseAsset,
              quantity: remainingQty,
            },
            tx,
          );
        }
      }

      return tx.platformOrder.update({
        where: { id },
        data: {
          status: PlatformOrderStatus.CANCELLED,
        },
        include: {
          tradingPair: {
            select: {
              symbol: true,
              baseAsset: true,
              quoteAsset: true,
            },
          },
        },
      });
    });
  }

  // ========== Admin Methods ==========

  async findAllAdmin(filterDto: GetOrderFilterDto) {
    const { status, side, type, tradingPairId, search, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    const where: Prisma.PlatformOrderWhereInput = {
      ...(status && { status }),
      ...(side && { side }),
      ...(type && { type }),
      ...(tradingPairId && { tradingPairId }),
      ...(search && {
        tradingPair: {
          symbol: { contains: search.toUpperCase(), mode: 'insensitive' as const },
        },
      }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.platformOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          tradingPair: {
            select: {
              symbol: true,
              baseAsset: true,
              quoteAsset: true,
            },
          },
        },
      }),
      this.prisma.platformOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
