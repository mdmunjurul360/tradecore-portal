import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { WalletLedgerService } from '../wallet-ledger/wallet-ledger.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/dto/create-notification.dto';
import { GetTradeFilterDto, TradeSideFilter } from './dto/get-trade-filter.dto';
import {
  Prisma,
  Trade,
  TradeStatus,
  OrderSide,
  PlatformOrderStatus,
  TransactionType,
  TransactionStatus,
} from '@prisma/client';

export interface ExecuteTradeSettlementParams {
  buyerOrderId: string;
  sellerOrderId: string;
  buyerId: string;
  sellerId: string;
  tradingPairId: string;
  quantity: number | string | Prisma.Decimal;
  price: number | string | Prisma.Decimal;
  executionTime?: Date;
  metadata?: any;
}

@Injectable()
export class TradeService {
  private readonly logger = new Logger(TradeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletLedgerService: WalletLedgerService,
    private readonly portfolioService: PortfolioService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Executes a complete, atomic trade settlement inside a Prisma transaction.
   * Responsibilities:
   * - Create Trade record
   * - Finalize locked quote funds from buyer wallet & credit quote funds to seller wallet
   * - Finalize locked base assets from seller portfolio & credit base assets to buyer portfolio
   * - Create double-entry ledger entries and transaction records
   * - Send trade execution notifications
   */
  async executeTradeSettlement(
    params: ExecuteTradeSettlementParams,
    txClient?: Prisma.TransactionClient,
  ): Promise<Trade> {
    const qtyDec = new Prisma.Decimal(params.quantity);
    const priceDec = new Prisma.Decimal(params.price);
    const totalDec = qtyDec.mul(priceDec);

    // 1. Validations
    if (qtyDec.lte(0)) {
      throw new BadRequestException('Trade quantity must be strictly positive');
    }
    if (priceDec.lte(0)) {
      throw new BadRequestException('Trade price must be strictly positive');
    }
    if (params.buyerId === params.sellerId) {
      throw new BadRequestException('Self-trading is strictly prohibited');
    }
    if (params.buyerOrderId === params.sellerOrderId) {
      throw new BadRequestException('Buyer and seller order IDs cannot be identical');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      // 2. Fetch trading pair to resolve base and quote assets
      const tradingPair = await tx.tradingPair.findUnique({
        where: { id: params.tradingPairId },
      });

      if (!tradingPair) {
        throw new BadRequestException(`Trading pair ${params.tradingPairId} not found`);
      }

      // 3. Fetch buyer and seller orders and validate order states
      const [buyerOrder, sellerOrder] = await Promise.all([
        tx.platformOrder.findUnique({ where: { id: params.buyerOrderId } }),
        tx.platformOrder.findUnique({ where: { id: params.sellerOrderId } }),
      ]);

      if (!buyerOrder || buyerOrder.side !== OrderSide.BUY) {
        throw new BadRequestException(`Invalid or non-BUY order: ${params.buyerOrderId}`);
      }
      if (!sellerOrder || sellerOrder.side !== OrderSide.SELL) {
        throw new BadRequestException(`Invalid or non-SELL order: ${params.sellerOrderId}`);
      }

      if (
        buyerOrder.status === PlatformOrderStatus.CANCELLED ||
        buyerOrder.status === PlatformOrderStatus.REJECTED ||
        buyerOrder.status === PlatformOrderStatus.FILLED
      ) {
        throw new BadRequestException(
          `Buyer order ${buyerOrder.id} is in invalid status for execution: ${buyerOrder.status}`,
        );
      }

      if (
        sellerOrder.status === PlatformOrderStatus.CANCELLED ||
        sellerOrder.status === PlatformOrderStatus.REJECTED ||
        sellerOrder.status === PlatformOrderStatus.FILLED
      ) {
        throw new BadRequestException(
          `Seller order ${sellerOrder.id} is in invalid status for execution: ${sellerOrder.status}`,
        );
      }

      // 4. Create immutable Trade record
      const trade = await tx.trade.create({
        data: {
          buyerOrderId: params.buyerOrderId,
          sellerOrderId: params.sellerOrderId,
          buyerId: params.buyerId,
          sellerId: params.sellerId,
          tradingPairId: params.tradingPairId,
          quantity: qtyDec,
          price: priceDec,
          total: totalDec,
          status: TradeStatus.SETTLED,
          executionTime: params.executionTime || new Date(),
          metadata: params.metadata ? (params.metadata as any) : undefined,
        },
      });

      // 5. Quote Financial Settlement (Buyer pays quote currency -> Seller receives quote currency)
      // a) Settle locked quote funds from buyer's wallet (deducts from lockedBalance)
      await this.walletLedgerService.settleWalletFunds(
        {
          userId: params.buyerId,
          currency: tradingPair.quoteAsset,
          amount: totalDec,
        },
        tx,
      );

      // Create transaction record and ledger debit entry for buyer's quote settlement
      const buyerWallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId: params.buyerId,
            currency: tradingPair.quoteAsset.toUpperCase(),
          },
        },
      });

      if (buyerWallet) {
        const buyerTx = await tx.transaction.create({
          data: {
            reference: `TRADE-BUY-${trade.id}`,
            walletId: buyerWallet.id,
            type: TransactionType.INTERNAL_TRANSFER,
            status: TransactionStatus.COMPLETED,
            amount: totalDec,
            currency: tradingPair.quoteAsset,
            netAmount: totalDec,
            metadata: { tradeId: trade.id, side: 'BUY', symbol: tradingPair.symbol },
          },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionId: buyerTx.id,
            accountId: buyerWallet.id,
            direction: 'DEBIT',
            amount: totalDec,
            currency: tradingPair.quoteAsset,
            description: `Trade settlement payment for ${tradingPair.symbol} BUY order ${params.buyerOrderId}`,
          },
        });
      }

      // b) Credit quote funds to seller's wallet with ledger entry & transaction record
      const sellerWallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId: params.sellerId,
            currency: tradingPair.quoteAsset.toUpperCase(),
          },
        },
      });

      if (!sellerWallet) {
        throw new BadRequestException(
          `Seller wallet not found for currency ${tradingPair.quoteAsset.toUpperCase()}`,
        );
      }

      await this.walletLedgerService.creditWallet(
        {
          walletId: sellerWallet.id,
          amount: totalDec,
          currency: tradingPair.quoteAsset,
          reference: `TRADE-SELL-${trade.id}`,
          type: TransactionType.INTERNAL_TRANSFER,
          status: TransactionStatus.COMPLETED,
          description: `Trade settlement proceeds for ${tradingPair.symbol} SELL order ${params.sellerOrderId}`,
          metadata: { tradeId: trade.id, side: 'SELL', symbol: tradingPair.symbol },
        },
        tx,
      );

      // 6. Base Asset Settlement (Seller transfers base asset -> Buyer receives base asset)
      // a) Settle locked base asset from seller's portfolio holding
      await this.portfolioService.settleAsset(
        {
          userId: params.sellerId,
          asset: tradingPair.baseAsset,
          quantity: qtyDec,
        },
        tx,
      );

      // b) Credit base asset to buyer's portfolio holding (upsert holding with cost tracking)
      await this.upsertPortfolioHolding(
        tx,
        params.buyerId,
        tradingPair.baseAsset,
        qtyDec,
        priceDec,
      );

      // 7. Fire-and-forget Notifications for buyer and seller
      this.sendTradeNotifications(
        trade.id,
        params.buyerId,
        params.sellerId,
        tradingPair.symbol,
        qtyDec,
        priceDec,
      ).catch((err) =>
        this.logger.error(`Failed to send trade settlement notifications: ${err.message}`),
      );

      this.logger.log(
        `Trade settled successfully: ${trade.id} | ${tradingPair.symbol} | Qty: ${qtyDec} @ ${priceDec} | Total: ${totalDec}`,
      );

      return trade;
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }

  // ============================================================
  // Query APIs
  // ============================================================

  /**
   * Fetches paginated trades for a specific user.
   */
  async findAll(userId: string, filterDto: GetTradeFilterDto) {
    const { tradingPairId, side, startDate, endDate, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.TradeWhereInput = {
      OR: [
        { buyerId: userId },
        { sellerId: userId },
      ],
      ...(tradingPairId && { tradingPairId }),
      ...(startDate || endDate
        ? {
            executionTime: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    // Filter by user side if specified
    if (side) {
      if (side === TradeSideFilter.BUY) {
        where.buyerId = userId;
        delete where.OR;
      } else if (side === TradeSideFilter.SELL) {
        where.sellerId = userId;
        delete where.OR;
      }
    }

    const [trades, total] = await Promise.all([
      this.prisma.trade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { executionTime: 'desc' },
        include: {
          tradingPair: true,
          buyerOrder: { select: { id: true, side: true, type: true, status: true } },
          sellerOrder: { select: { id: true, side: true, type: true, status: true } },
        },
      }),
      this.prisma.trade.count({ where }),
    ]);

    return {
      data: trades,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetches single trade details by ID.
   */
  async findOne(id: string, userId?: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: {
        tradingPair: true,
        buyer: { select: { id: true, email: true } },
        seller: { select: { id: true, email: true } },
        buyerOrder: true,
        sellerOrder: true,
      },
    });

    if (!trade) {
      throw new NotFoundException(`Trade ${id} not found`);
    }

    if (userId && trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new NotFoundException(`Trade ${id} not found`);
    }

    return trade;
  }

  /**
   * Admin query API for all trades across the platform.
   */
  async findAdminAll(filterDto: GetTradeFilterDto) {
    const { tradingPairId, startDate, endDate, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.TradeWhereInput = {
      ...(tradingPairId && { tradingPairId }),
      ...(startDate || endDate
        ? {
            executionTime: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [trades, total] = await Promise.all([
      this.prisma.trade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { executionTime: 'desc' },
        include: {
          tradingPair: true,
          buyer: { select: { id: true, email: true } },
          seller: { select: { id: true, email: true } },
          buyerOrder: { select: { id: true, price: true, quantity: true } },
          sellerOrder: { select: { id: true, price: true, quantity: true } },
        },
      }),
      this.prisma.trade.count({ where }),
    ]);

    return {
      data: trades,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Updates or inserts a portfolio holding record for the buyer.
   */
  private async upsertPortfolioHolding(
    tx: Prisma.TransactionClient,
    userId: string,
    asset: string,
    quantity: Prisma.Decimal,
    price: Prisma.Decimal,
  ): Promise<void> {
    const normalizedAsset = asset.toUpperCase();
    const cost = price.mul(quantity);

    const existing = await tx.portfolioHolding.findUnique({
      where: {
        userId_asset: {
          userId,
          asset: normalizedAsset,
        },
      },
    });

    if (existing) {
      const newQuantity = existing.quantity.plus(quantity);
      const newTotalCost = existing.totalCost.plus(cost);
      const newAvgPrice = newQuantity.gt(0)
        ? newTotalCost.div(newQuantity)
        : new Prisma.Decimal(0);

      await tx.portfolioHolding.update({
        where: { id: existing.id },
        data: {
          quantity: newQuantity,
          totalCost: newTotalCost,
          averageBuyPrice: newAvgPrice,
        },
      });
    } else {
      await tx.portfolioHolding.create({
        data: {
          userId,
          asset: normalizedAsset,
          quantity,
          lockedQuantity: new Prisma.Decimal(0),
          averageBuyPrice: price,
          totalCost: cost,
          realizedPnL: new Prisma.Decimal(0),
        },
      });
    }
  }

  /**
   * Sends match & trade settlement notifications to buyer and seller.
   */
  private async sendTradeNotifications(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    symbol: string,
    quantity: Prisma.Decimal,
    price: Prisma.Decimal,
  ): Promise<void> {
    const total = quantity.mul(price);

    // Buyer notification
    await this.notificationService.createNotification(buyerId, {
      type: NotificationType.IN_APP,
      title: 'Trade Executed & Settled',
      message: `Bought ${quantity} ${symbol} @ ${price} (Total: ${total})`,
      metadata: { tradeId, side: 'BUY', symbol, quantity: quantity.toString(), price: price.toString() },
    });

    // Seller notification
    await this.notificationService.createNotification(sellerId, {
      type: NotificationType.IN_APP,
      title: 'Trade Executed & Settled',
      message: `Sold ${quantity} ${symbol} @ ${price} (Total: ${total})`,
      metadata: { tradeId, side: 'SELL', symbol, quantity: quantity.toString(), price: price.toString() },
    });
  }
}
