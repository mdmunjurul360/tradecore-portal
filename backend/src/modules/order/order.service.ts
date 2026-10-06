import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { WalletLedgerService } from '../wallet-ledger/wallet-ledger.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { MatchingEngineService } from '../matching-engine/matching-engine.service';
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
    private readonly matchingEngineService: MatchingEngineService,
  ) {}

  async create(userId: string, dto: CreateOrderDto, isDemoMode = false) {
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Validate trading pair exists and is active
      const tradingPair = await tx.tradingPair.findUnique({
        where: { symbol: dto.symbol },
      });

      if (!tradingPair) {
        throw new NotFoundException(`Trading pair with symbol ${dto.symbol} not found`);
      }

      if (!tradingPair.isActive || tradingPair.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Trading pair ${tradingPair.symbol} is currently not available for trading`,
        );
      }

      // 2. Validate quantity against trading pair constraints
      const quantity = new Prisma.Decimal(dto.amount);

      if (quantity.lt(tradingPair.minOrderSize)) {
        throw new BadRequestException(
          `Order quantity ${dto.amount} is below the minimum order size of ${tradingPair.minOrderSize}`,
        );
      }

      if (quantity.gt(tradingPair.maxOrderSize)) {
        throw new BadRequestException(
          `Order quantity ${dto.amount} exceeds the maximum order size of ${tradingPair.maxOrderSize}`,
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
      if (dto.isCfd) {
        if (dto.price === undefined || dto.price === null) {
          throw new BadRequestException('Estimated price is required for CFD orders');
        }
        const marginRequired = quantity.mul(new Prisma.Decimal(dto.price)).div(100); // 1:100 Leverage
        await this.walletLedgerService.lockWalletFunds(
          {
            userId,
            currency: tradingPair.quoteAsset,
            amount: marginRequired,
          },
          tx,
        );
      } else {
        if (dto.side === OrderSide.BUY) {
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
          await this.portfolioService.lockAsset(
            {
              userId,
              asset: tradingPair.baseAsset,
              quantity,
            },
            tx,
          );
        }
      }

      // 5. Create the order
      const metadata = {
        isDemo: isDemoMode,
        isCfd: dto.isCfd,
        isPosition: dto.isCfd && dto.type === OrderType.MARKET,
        stopLoss: dto.stopLoss,
        takeProfit: dto.takeProfit
      };

      const order = await tx.platformOrder.create({
        data: {
          userId,
          tradingPairId: tradingPair.id,
          side: dto.side,
          type: dto.type,
          status: PlatformOrderStatus.PENDING,
          quantity,
          filledQuantity: 0,
          remainingQuantity: quantity,
          price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : null,
          averagePrice: null,
          metadata: metadata as any,
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

      if (!isDemoMode && dto.isCfd) {
        const referral = await tx.referral.findFirst({
          where: { referredId: userId }
        });
        if (referral) {
          const commission = quantity.mul(2); // $2 per lot commission
          await tx.referral.update({
            where: { id: referral.id },
            data: { 
              rewardAmount: { increment: commission },
              status: 'REWARDED' 
            }
          });
          
          const referrerWallet = await tx.wallet.findFirst({
            where: { userId: referral.referrerId, currency: 'USD', type: 'REAL' }
          });
          
          if (referrerWallet) {
            await tx.wallet.update({
              where: { id: referrerWallet.id },
              data: { balance: { increment: commission } }
            });
          }
        }
      }

      return order;
    });

    try {
      if (!dto.isCfd) {
        await this.matchingEngineService.matchOrder(order.id);
      }
    } catch (e) {
      console.error(`Matching engine failed for order ${order.id}:`, e);
    }

    return this.findOne(userId, order.id, isDemoMode);
  }

  async getOpenOrders(userId: string, symbol?: string, isDemoMode = false) {
    const where: Prisma.PlatformOrderWhereInput = {
      userId,
      status: {
        in: [PlatformOrderStatus.PENDING, PlatformOrderStatus.PARTIALLY_FILLED]
      },
      metadata: {
        path: ['isDemo'],
        equals: isDemoMode,
      },
    };

    if (symbol) {
      where.tradingPair = { symbol: { equals: symbol, mode: 'insensitive' } };
    }

    return this.prisma.platformOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tradingPair: {
          select: { symbol: true, baseAsset: true, quoteAsset: true },
        },
      },
    });
  }

  async getOrderHistory(userId: string, symbol?: string, isDemoMode = false) {
    const where: Prisma.PlatformOrderWhereInput = {
      userId,
      status: {
        in: [PlatformOrderStatus.FILLED, PlatformOrderStatus.CANCELLED, PlatformOrderStatus.REJECTED]
      },
      metadata: {
        path: ['isDemo'],
        equals: isDemoMode,
      },
    };

    if (symbol) {
      where.tradingPair = { symbol: { equals: symbol, mode: 'insensitive' } };
    }

    return this.prisma.platformOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Reasonable limit for history
      include: {
        tradingPair: {
          select: { symbol: true, baseAsset: true, quoteAsset: true },
        },
      },
    });
  }

  async findAll(userId: string, filterDto: GetOrderFilterDto, isDemoMode = false) {
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
      metadata: {
        path: ['isDemo'],
        equals: isDemoMode,
      },
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

  async findOne(userId: string, id: string, isDemoMode = false) {
    const order = await this.prisma.platformOrder.findFirst({
      where: { 
        id, 
        userId,
        metadata: {
          path: ['isDemo'],
          equals: isDemoMode,
        },
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

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async cancel(userId: string, id: string, isDemoMode = false, currentPrice?: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.platformOrder.findFirst({
        where: { 
          id, 
          userId,
          metadata: {
            path: ['isDemo'],
            equals: isDemoMode,
          },
        },
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

      const remainingQty = new Prisma.Decimal(order.remainingQuantity);
      const metadata = order.metadata as any || {};

      if (metadata.isCfd) {
        // Unlock CFD Margin
        if (remainingQty.gt(0) && order.price) {
          const marginRequired = remainingQty.mul(order.price).div(100);
          await this.walletLedgerService.unlockWalletFunds(
            {
              userId,
              currency: order.tradingPair.quoteAsset,
              amount: marginRequired,
            },
            tx,
          );
        }

        // If it's an active position being closed, calculate and settle PnL
        if (metadata.isPosition && currentPrice && order.price && remainingQty.gt(0)) {
          const openPrice = order.price;
          const closePrice = new Prisma.Decimal(currentPrice);
          let profit = new Prisma.Decimal(0);
          
          if (order.side === 'BUY') {
            profit = closePrice.minus(openPrice).mul(remainingQty).mul(100000);
          } else {
            profit = openPrice.minus(closePrice).mul(remainingQty).mul(100000);
          }

          if (!profit.equals(0)) {
            const wallet = await tx.wallet.findFirst({
              where: { userId, currency: order.tradingPair.quoteAsset, type: isDemoMode ? 'DEMO' : 'REAL' }
            });
            
            if (wallet) {
              await this.walletLedgerService.executeAtomicWalletTransaction({
                walletId: wallet.id,
                amount: profit.abs(),
                currency: order.tradingPair.quoteAsset,
                type: profit.gt(0) ? 'DEPOSIT' : 'WITHDRAWAL',
                reference: `PNL-${order.id}-${Date.now()}`,
                description: `PnL Settlement for ${order.tradingPair.symbol}`,
              }, tx);
            }
          }
        }
      } else {
        // Unlock Spot funds
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
      }

      return tx.platformOrder.update({
        where: { id },
        data: {
          status: metadata.isPosition ? PlatformOrderStatus.FILLED : PlatformOrderStatus.CANCELLED,
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
