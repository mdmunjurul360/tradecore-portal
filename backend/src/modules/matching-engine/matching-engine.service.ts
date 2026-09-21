import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { WalletLedgerService } from '../wallet-ledger/wallet-ledger.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/dto/create-notification.dto';
import { TradeService } from '../trade/trade.service';
import {
  Prisma,
  OrderSide,
  OrderType,
  PlatformOrderStatus,
  PlatformOrder,
  TradingPair,
} from '@prisma/client';

// ============================================================
// Interfaces
// ============================================================

export interface MatchResult {
  matchedTradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  tradingPairId: string;
  executionPrice: Prisma.Decimal;
  executionQuantity: Prisma.Decimal;
  buyerUserId: string;
  sellerUserId: string;
}

export interface MatchingEngineResult {
  incomingOrderId: string;
  incomingOrderFinalStatus: PlatformOrderStatus;
  matches: MatchResult[];
  totalFilledQuantity: Prisma.Decimal;
  averageExecutionPrice: Prisma.Decimal | null;
}

type OrderWithTradingPair = PlatformOrder & { tradingPair: TradingPair };

// ============================================================
// Service
// ============================================================

@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletLedgerService: WalletLedgerService,
    private readonly portfolioService: PortfolioService,
    private readonly notificationService: NotificationService,
    private readonly tradeService: TradeService,
  ) {}

  // ============================================================
  // Public API
  // ============================================================

  /**
   * Attempts to match an incoming order against the order book for the given trading pair.
   * Executes all fills, settlements, and order status updates within a single ACID transaction.
   */
  async matchOrder(orderId: string): Promise<MatchingEngineResult> {
    return this.prisma.$transaction(
      async (tx) => {
        // 1. Load the incoming order
        const incomingOrder = await tx.platformOrder.findUnique({
          where: { id: orderId },
          include: { tradingPair: true },
        });

        if (!incomingOrder) {
          throw new BadRequestException(`Order ${orderId} not found`);
        }

        if (
          incomingOrder.status !== PlatformOrderStatus.PENDING &&
          incomingOrder.status !== PlatformOrderStatus.PARTIALLY_FILLED
        ) {
          throw new BadRequestException(
            `Order ${orderId} is ${incomingOrder.status}. Only PENDING or PARTIALLY_FILLED orders can be matched.`,
          );
        }

        // 2. Fetch matching counterpart orders from the book
        const counterOrders = await this.fetchCounterOrders(
          tx,
          incomingOrder,
        );

        // 3. Execute matching loop
        const matches: MatchResult[] = [];
        let remainingQty = new Prisma.Decimal(incomingOrder.remainingQuantity);
        let totalFilledQty = new Prisma.Decimal(0);
        let weightedPriceSum = new Prisma.Decimal(0);

        for (const counterOrder of counterOrders) {
          if (remainingQty.lte(0)) break;

          // Self-match prevention
          if (counterOrder.userId === incomingOrder.userId) {
            this.logger.debug(
              `Skipping self-match: order ${counterOrder.id} belongs to same user ${counterOrder.userId}`,
            );
            continue;
          }

          // Determine execution price and quantity
          const executionPrice = this.determineExecutionPrice(
            incomingOrder,
            counterOrder,
          );
          const counterRemaining = new Prisma.Decimal(counterOrder.remainingQuantity);
          const executionQty = Prisma.Decimal.min(remainingQty, counterRemaining);

          if (executionQty.lte(0)) continue;

          // Execute the fill
          const matchResult = await this.executeFill(
            tx,
            incomingOrder,
            counterOrder,
            executionPrice,
            executionQty,
          );
          matches.push(matchResult);

          // Update running totals
          remainingQty = remainingQty.minus(executionQty);
          totalFilledQty = totalFilledQty.plus(executionQty);
          weightedPriceSum = weightedPriceSum.plus(
            executionPrice.mul(executionQty),
          );

          // Update the counter order's in-memory state for subsequent iterations
          counterOrder.remainingQuantity = counterRemaining.minus(executionQty);
          counterOrder.filledQuantity = new Prisma.Decimal(counterOrder.filledQuantity).plus(executionQty);
        }

        // 4. Update the incoming order's final state
        const averageExecutionPrice = totalFilledQty.gt(0)
          ? weightedPriceSum.div(totalFilledQty)
          : null;

        const previousAvgPrice = incomingOrder.averagePrice
          ? new Prisma.Decimal(incomingOrder.averagePrice)
          : null;
        const previousFilledQty = new Prisma.Decimal(incomingOrder.filledQuantity);

        const cumulativeFilledQty = previousFilledQty.plus(totalFilledQty);
        const cumulativeAvgPrice = this.calculateCumulativeAveragePrice(
          previousAvgPrice,
          previousFilledQty,
          averageExecutionPrice,
          totalFilledQty,
        );

        const finalStatus = this.determineFinalStatus(
          incomingOrder,
          remainingQty,
        );

        await tx.platformOrder.update({
          where: { id: incomingOrder.id },
          data: {
            filledQuantity: cumulativeFilledQty,
            remainingQuantity: remainingQty,
            averagePrice: cumulativeAvgPrice,
            status: finalStatus,
          },
        });

        // 5. Send notifications (fire-and-forget, outside of critical path)
        this.sendMatchNotifications(incomingOrder, matches, finalStatus).catch(
          (err) =>
            this.logger.error(
              `Failed to send match notifications for order ${orderId}: ${err.message}`,
            ),
        );

        return {
          incomingOrderId: incomingOrder.id,
          incomingOrderFinalStatus: finalStatus,
          matches,
          totalFilledQuantity: totalFilledQty,
          averageExecutionPrice: averageExecutionPrice,
        };
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  // ============================================================
  // Counter Order Fetching (Price-Time Priority)
  // ============================================================

  /**
   * Fetches matching counterpart orders from the order book using price-time priority:
   * - For incoming BUY: fetch SELL orders, lowest price first, then oldest first.
   * - For incoming SELL: fetch BUY orders, highest price first, then oldest first.
   * Excludes cancelled, filled, and rejected orders.
   */
  private async fetchCounterOrders(
    tx: Prisma.TransactionClient,
    incomingOrder: OrderWithTradingPair,
  ): Promise<OrderWithTradingPair[]> {
    const isBuy = incomingOrder.side === OrderSide.BUY;

    const priceFilter: Prisma.PlatformOrderWhereInput = {};

    // For LIMIT orders, apply price constraint
    if (incomingOrder.type === OrderType.LIMIT && incomingOrder.price) {
      if (isBuy) {
        // BUY LIMIT: match SELL orders at or below the buyer's limit price
        priceFilter.price = { lte: incomingOrder.price };
      } else {
        // SELL LIMIT: match BUY orders at or above the seller's limit price
        priceFilter.price = { gte: incomingOrder.price };
      }
    }

    return tx.platformOrder.findMany({
      where: {
        tradingPairId: incomingOrder.tradingPairId,
        side: isBuy ? OrderSide.SELL : OrderSide.BUY,
        status: {
          in: [PlatformOrderStatus.PENDING, PlatformOrderStatus.PARTIALLY_FILLED],
        },
        remainingQuantity: { gt: 0 },
        ...priceFilter,
      },
      orderBy: [
        // Price-time priority: best price first, then FIFO
        { price: isBuy ? 'asc' : 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        tradingPair: true,
      },
    }) as Promise<OrderWithTradingPair[]>;
  }

  // ============================================================
  // Execution Price Determination
  // ============================================================

  /**
   * Determines the execution price for a match between two orders.
   * The resting order's price takes priority (maker price).
   * For MARKET vs LIMIT: uses the LIMIT order's price.
   * For LIMIT vs LIMIT: uses the earlier (resting/maker) order's price.
   */
  private determineExecutionPrice(
    incomingOrder: OrderWithTradingPair,
    counterOrder: OrderWithTradingPair,
  ): Prisma.Decimal {
    // If the counter (resting) order has a price, use it (maker price)
    if (counterOrder.price) {
      return new Prisma.Decimal(counterOrder.price);
    }

    // If the incoming order has a price (e.g., incoming LIMIT vs resting MARKET)
    if (incomingOrder.price) {
      return new Prisma.Decimal(incomingOrder.price);
    }

    // Both are MARKET orders – this should be rare in real systems.
    // Use the incoming order's price field which is required for balance locking.
    throw new BadRequestException(
      'Cannot determine execution price: both orders lack a price. At least one order must have a defined price.',
    );
  }

  // ============================================================
  // Fill Execution (Atomic)
  // ============================================================

  /**
   * Executes a single fill between two orders within the same transaction.
   * Updates both orders, settles locked funds/assets, and credits the counterparts.
   */
  private async executeFill(
    tx: Prisma.TransactionClient,
    incomingOrder: OrderWithTradingPair,
    counterOrder: OrderWithTradingPair,
    executionPrice: Prisma.Decimal,
    executionQty: Prisma.Decimal,
  ): Promise<MatchResult> {
    const tradingPair = incomingOrder.tradingPair;
    const tradeId = `TRADE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const quoteCost = executionPrice.mul(executionQty);

    // Identify buyer and seller
    const buyOrder =
      incomingOrder.side === OrderSide.BUY ? incomingOrder : counterOrder;
    const sellOrder =
      incomingOrder.side === OrderSide.SELL ? incomingOrder : counterOrder;

    // Execute atomic trade settlement via TradeService
    const trade = await this.tradeService.executeTradeSettlement(
      {
        buyerOrderId: buyOrder.id,
        sellerOrderId: sellOrder.id,
        buyerId: buyOrder.userId,
        sellerId: sellOrder.userId,
        tradingPairId: tradingPair.id,
        quantity: executionQty,
        price: executionPrice,
      },
      tx,
    );

    // ---- Update Counter Order ----
    const counterRemaining = new Prisma.Decimal(counterOrder.remainingQuantity).minus(executionQty);
    const counterFilled = new Prisma.Decimal(counterOrder.filledQuantity).plus(executionQty);

    const counterPreviousAvgPrice = counterOrder.averagePrice
      ? new Prisma.Decimal(counterOrder.averagePrice)
      : null;
    const counterPreviousFilled = new Prisma.Decimal(counterOrder.filledQuantity);

    const counterAvgPrice = this.calculateCumulativeAveragePrice(
      counterPreviousAvgPrice,
      counterPreviousFilled,
      executionPrice,
      executionQty,
    );

    const counterStatus = counterRemaining.lte(0)
      ? PlatformOrderStatus.FILLED
      : PlatformOrderStatus.PARTIALLY_FILLED;

    await tx.platformOrder.update({
      where: { id: counterOrder.id },
      data: {
        filledQuantity: counterFilled,
        remainingQuantity: counterRemaining,
        averagePrice: counterAvgPrice,
        status: counterStatus,
      },
    });

    this.logger.log(
      `Fill executed: ${trade.id} | ${tradingPair.symbol} | Qty: ${executionQty} @ ${executionPrice} | Buyer: ${buyOrder.userId} | Seller: ${sellOrder.userId}`,
    );

    return {
      matchedTradeId: trade.id,
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
      tradingPairId: tradingPair.id,
      executionPrice,
      executionQuantity: executionQty,
      buyerUserId: buyOrder.userId,
      sellerUserId: sellOrder.userId,
    };
  }

  // ============================================================
  // Price Calculation Utilities
  // ============================================================

  /**
   * Calculates the cumulative volume-weighted average price across multiple fills.
   */
  private calculateCumulativeAveragePrice(
    previousAvgPrice: Prisma.Decimal | null,
    previousFilledQty: Prisma.Decimal,
    newExecutionPrice: Prisma.Decimal | null,
    newExecutionQty: Prisma.Decimal,
  ): Prisma.Decimal | null {
    if (!newExecutionPrice || newExecutionQty.lte(0)) {
      return previousAvgPrice;
    }

    const prevValue = previousAvgPrice
      ? previousAvgPrice.mul(previousFilledQty)
      : new Prisma.Decimal(0);
    const newValue = newExecutionPrice.mul(newExecutionQty);
    const totalQty = previousFilledQty.plus(newExecutionQty);

    if (totalQty.lte(0)) return null;

    return prevValue.plus(newValue).div(totalQty);
  }

  // ============================================================
  // Order Status Determination
  // ============================================================

  /**
   * Determines the final status of the incoming order based on remaining quantity.
   */
  private determineFinalStatus(
    order: PlatformOrder,
    remainingQty: Prisma.Decimal,
  ): PlatformOrderStatus {
    if (remainingQty.lte(0)) {
      return PlatformOrderStatus.FILLED;
    }

    const originalQty = new Prisma.Decimal(order.quantity);
    if (remainingQty.lt(originalQty)) {
      return PlatformOrderStatus.PARTIALLY_FILLED;
    }

    // No fills occurred – status remains as-is
    return order.status;
  }

  // ============================================================
  // Notification Hook
  // ============================================================

  /**
   * Sends trade execution notifications to all involved parties.
   * This is fire-and-forget to avoid blocking the matching transaction.
   */
  private async sendMatchNotifications(
    incomingOrder: OrderWithTradingPair,
    matches: MatchResult[],
    finalStatus: PlatformOrderStatus,
  ): Promise<void> {
    if (matches.length === 0) return;

    const notifiedUsers = new Set<string>();
    const symbol = incomingOrder.tradingPair.symbol;

    for (const match of matches) {
      // Notify buyer
      if (!notifiedUsers.has(match.buyerUserId)) {
        await this.notificationService.createNotification(
          match.buyerUserId,
          {
            type: NotificationType.IN_APP,
            title: 'Order Filled',
            message: `Your BUY order for ${symbol} was filled: ${match.executionQuantity} @ ${match.executionPrice}`,
            metadata: {
              orderId: match.buyOrderId,
              tradeId: match.matchedTradeId,
              side: 'BUY',
              symbol,
              quantity: match.executionQuantity.toString(),
              price: match.executionPrice.toString(),
            },
          },
        );
        notifiedUsers.add(match.buyerUserId);
      }

      // Notify seller
      if (!notifiedUsers.has(match.sellerUserId)) {
        await this.notificationService.createNotification(
          match.sellerUserId,
          {
            type: NotificationType.IN_APP,
            title: 'Order Filled',
            message: `Your SELL order for ${symbol} was filled: ${match.executionQuantity} @ ${match.executionPrice}`,
            metadata: {
              orderId: match.sellOrderId,
              tradeId: match.matchedTradeId,
              side: 'SELL',
              symbol,
              quantity: match.executionQuantity.toString(),
              price: match.executionPrice.toString(),
            },
          },
        );
        notifiedUsers.add(match.sellerUserId);
      }
    }

    // Notify incoming order owner about final status if partially filled
    if (
      finalStatus === PlatformOrderStatus.PARTIALLY_FILLED &&
      !notifiedUsers.has(incomingOrder.userId)
    ) {
      const totalFilled = matches.reduce(
        (sum, m) => sum.plus(m.executionQuantity),
        new Prisma.Decimal(0),
      );

      await this.notificationService.createNotification(
        incomingOrder.userId,
        {
          type: NotificationType.IN_APP,
          title: 'Order Partially Filled',
          message: `Your ${incomingOrder.side} order for ${symbol} was partially filled: ${totalFilled} of ${incomingOrder.quantity}`,
          metadata: {
            orderId: incomingOrder.id,
            side: incomingOrder.side,
            symbol,
            filledQuantity: totalFilled.toString(),
            totalQuantity: incomingOrder.quantity.toString(),
          },
        },
      );
    }
  }
}
