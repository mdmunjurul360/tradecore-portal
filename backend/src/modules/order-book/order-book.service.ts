import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { GetOrderBookDto } from './dto/get-order-book.dto';
import { GetMarketDataDto } from './dto/get-market-data.dto';
import {
  Prisma,
  OrderSide,
  PlatformOrderStatus,
  TradingPairStatus,
  TradeStatus,
} from '@prisma/client';

// ============================================================
// Interfaces
// ============================================================

export interface OrderBookLevel {
  price: string;
  quantity: string;
  orderCount: number;
}

export interface OrderBookSnapshot {
  tradingPairId: string;
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
}

export interface BestBidAsk {
  tradingPairId: string;
  symbol: string;
  bestBid: { price: string; quantity: string } | null;
  bestAsk: { price: string; quantity: string } | null;
  spread: string | null;
  timestamp: string;
}

export interface MarketDepthLevel {
  price: string;
  quantity: string;
  total: string;
  cumulativeQuantity: string;
  orderCount: number;
}

export interface MarketDepthSnapshot {
  tradingPairId: string;
  symbol: string;
  bids: MarketDepthLevel[];
  asks: MarketDepthLevel[];
  timestamp: string;
}

export interface MarketSummary {
  tradingPairId: string;
  symbol: string;
  lastPrice: string | null;
  volume24h: string;
  tradeCount24h: number;
  high24h: string | null;
  low24h: string | null;
  vwap24h: string | null;
  bestBid: string | null;
  bestAsk: string | null;
  spread: string | null;
  timestamp: string;
}

// ============================================================
// Service
// ============================================================

@Injectable()
export class OrderBookService {
  private readonly logger = new Logger(OrderBookService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Trading Pair Resolution
  // ============================================================

  /**
   * Resolves a trading pair from either tradingPairId or symbol.
   * Validates that the pair is active.
   */
  private async resolveTradingPair(
    tradingPairId?: string,
    symbol?: string,
  ) {
    if (!tradingPairId && !symbol) {
      throw new BadRequestException(
        'Either tradingPairId or symbol must be provided',
      );
    }

    const tradingPair = tradingPairId
      ? await this.prisma.tradingPair.findUnique({
          where: { id: tradingPairId },
        })
      : await this.prisma.tradingPair.findUnique({
          where: { symbol: symbol!.toUpperCase() },
        });

    if (!tradingPair) {
      throw new BadRequestException(
        `Trading pair not found: ${tradingPairId || symbol}`,
      );
    }

    if (
      tradingPair.status !== TradingPairStatus.ACTIVE ||
      !tradingPair.isActive
    ) {
      throw new BadRequestException(
        `Trading pair ${tradingPair.symbol} is not currently active`,
      );
    }

    return tradingPair;
  }

  // ============================================================
  // Order Book: Full Book
  // ============================================================

  /**
   * Returns the full order book snapshot for a trading pair.
   * Aggregates open orders by price level (bids descending, asks ascending).
   */
  async getOrderBook(dto: GetOrderBookDto): Promise<OrderBookSnapshot> {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    const depth = dto.depth || 20;

    const [bids, asks] = await Promise.all([
      this.getAggregatedLevels(
        tradingPair.id,
        OrderSide.BUY,
        depth,
        'desc',
      ),
      this.getAggregatedLevels(
        tradingPair.id,
        OrderSide.SELL,
        depth,
        'asc',
      ),
    ]);

    return {
      tradingPairId: tradingPair.id,
      symbol: tradingPair.symbol,
      bids,
      asks,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // Order Book: Best Bid & Ask
  // ============================================================

  /**
   * Returns the best bid (highest buy) and best ask (lowest sell).
   */
  async getBestBidAsk(dto: GetMarketDataDto): Promise<BestBidAsk> {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    const [bestBidOrder, bestAskOrder] = await Promise.all([
      this.prisma.platformOrder.findFirst({
        where: {
          tradingPairId: tradingPair.id,
          side: OrderSide.BUY,
          status: {
            in: [
              PlatformOrderStatus.PENDING,
              PlatformOrderStatus.PARTIALLY_FILLED,
            ],
          },
          remainingQuantity: { gt: 0 },
          price: { not: null },
        },
        orderBy: { price: 'desc' },
        select: { price: true, remainingQuantity: true },
      }),
      this.prisma.platformOrder.findFirst({
        where: {
          tradingPairId: tradingPair.id,
          side: OrderSide.SELL,
          status: {
            in: [
              PlatformOrderStatus.PENDING,
              PlatformOrderStatus.PARTIALLY_FILLED,
            ],
          },
          remainingQuantity: { gt: 0 },
          price: { not: null },
        },
        orderBy: { price: 'asc' },
        select: { price: true, remainingQuantity: true },
      }),
    ]);

    const bestBid = bestBidOrder
      ? {
          price: bestBidOrder.price!.toString(),
          quantity: bestBidOrder.remainingQuantity.toString(),
        }
      : null;

    const bestAsk = bestAskOrder
      ? {
          price: bestAskOrder.price!.toString(),
          quantity: bestAskOrder.remainingQuantity.toString(),
        }
      : null;

    let spread: string | null = null;
    if (bestBid && bestAsk) {
      const bidPrice = new Prisma.Decimal(bestBid.price);
      const askPrice = new Prisma.Decimal(bestAsk.price);
      spread = askPrice.minus(bidPrice).toString();
    }

    return {
      tradingPairId: tradingPair.id,
      symbol: tradingPair.symbol,
      bestBid,
      bestAsk,
      spread,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // Order Book: Market Depth
  // ============================================================

  /**
   * Returns the market depth with cumulative quantities for visualization.
   */
  async getMarketDepth(dto: GetOrderBookDto): Promise<MarketDepthSnapshot> {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    const depth = dto.depth || 20;

    const [rawBids, rawAsks] = await Promise.all([
      this.getAggregatedLevels(
        tradingPair.id,
        OrderSide.BUY,
        depth,
        'desc',
      ),
      this.getAggregatedLevels(
        tradingPair.id,
        OrderSide.SELL,
        depth,
        'asc',
      ),
    ]);

    const bids = this.buildDepthLevels(rawBids);
    const asks = this.buildDepthLevels(rawAsks);

    return {
      tradingPairId: tradingPair.id,
      symbol: tradingPair.symbol,
      bids,
      asks,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // Order Book: Open BUY / SELL Orders
  // ============================================================

  /**
   * Returns paginated open BUY orders for a trading pair (highest price first).
   */
  async getOpenBuyOrders(dto: GetOrderBookDto) {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    return this.getOpenOrders(
      tradingPair.id,
      tradingPair.symbol,
      OrderSide.BUY,
      dto.limit || 50,
    );
  }

  /**
   * Returns paginated open SELL orders for a trading pair (lowest price first).
   */
  async getOpenSellOrders(dto: GetOrderBookDto) {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    return this.getOpenOrders(
      tradingPair.id,
      tradingPair.symbol,
      OrderSide.SELL,
      dto.limit || 50,
    );
  }

  // ============================================================
  // Market Data: Last Traded Price
  // ============================================================

  /**
   * Returns the most recent trade execution price for a trading pair.
   */
  async getLastTradedPrice(dto: GetMarketDataDto) {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    const lastTrade = await this.prisma.trade.findFirst({
      where: {
        tradingPairId: tradingPair.id,
        status: TradeStatus.SETTLED,
      },
      orderBy: { executionTime: 'desc' },
      select: {
        price: true,
        quantity: true,
        executionTime: true,
      },
    });

    return {
      tradingPairId: tradingPair.id,
      symbol: tradingPair.symbol,
      lastPrice: lastTrade ? lastTrade.price.toString() : null,
      lastQuantity: lastTrade ? lastTrade.quantity.toString() : null,
      lastTradeTime: lastTrade ? lastTrade.executionTime.toISOString() : null,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // Market Data: 24h Statistics
  // ============================================================

  /**
   * Returns 24-hour trading statistics for a trading pair.
   */
  async get24hStats(dto: GetMarketDataDto) {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trades = await this.prisma.trade.findMany({
      where: {
        tradingPairId: tradingPair.id,
        status: TradeStatus.SETTLED,
        executionTime: { gte: twentyFourHoursAgo },
      },
      select: {
        price: true,
        quantity: true,
        total: true,
      },
    });

    let volume = new Prisma.Decimal(0);
    let quoteVolume = new Prisma.Decimal(0);
    let high: Prisma.Decimal | null = null;
    let low: Prisma.Decimal | null = null;

    for (const trade of trades) {
      volume = volume.plus(trade.quantity);
      quoteVolume = quoteVolume.plus(trade.total);

      if (high === null || trade.price.gt(high)) {
        high = trade.price;
      }
      if (low === null || trade.price.lt(low)) {
        low = trade.price;
      }
    }

    const vwap =
      volume.gt(0) ? quoteVolume.div(volume) : null;

    return {
      tradingPairId: tradingPair.id,
      symbol: tradingPair.symbol,
      volume24h: volume.toString(),
      quoteVolume24h: quoteVolume.toString(),
      tradeCount24h: trades.length,
      high24h: high ? high.toString() : null,
      low24h: low ? low.toString() : null,
      vwap24h: vwap ? vwap.toString() : null,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // Market Data: Market Summary
  // ============================================================

  /**
   * Returns a comprehensive market summary combining order book and trade data.
   */
  async getMarketSummary(dto: GetMarketDataDto): Promise<MarketSummary> {
    const tradingPair = await this.resolveTradingPair(
      dto.tradingPairId,
      dto.symbol,
    );

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Parallel fetch: last price, 24h trades, best bid, best ask
    const [lastTrade, trades24h, bestBidOrder, bestAskOrder] =
      await Promise.all([
        this.prisma.trade.findFirst({
          where: {
            tradingPairId: tradingPair.id,
            status: TradeStatus.SETTLED,
          },
          orderBy: { executionTime: 'desc' },
          select: { price: true },
        }),
        this.prisma.trade.findMany({
          where: {
            tradingPairId: tradingPair.id,
            status: TradeStatus.SETTLED,
            executionTime: { gte: twentyFourHoursAgo },
          },
          select: { price: true, quantity: true, total: true },
        }),
        this.prisma.platformOrder.findFirst({
          where: {
            tradingPairId: tradingPair.id,
            side: OrderSide.BUY,
            status: {
              in: [
                PlatformOrderStatus.PENDING,
                PlatformOrderStatus.PARTIALLY_FILLED,
              ],
            },
            remainingQuantity: { gt: 0 },
            price: { not: null },
          },
          orderBy: { price: 'desc' },
          select: { price: true },
        }),
        this.prisma.platformOrder.findFirst({
          where: {
            tradingPairId: tradingPair.id,
            side: OrderSide.SELL,
            status: {
              in: [
                PlatformOrderStatus.PENDING,
                PlatformOrderStatus.PARTIALLY_FILLED,
              ],
            },
            remainingQuantity: { gt: 0 },
            price: { not: null },
          },
          orderBy: { price: 'asc' },
          select: { price: true },
        }),
      ]);

    // Compute 24h stats
    let volume = new Prisma.Decimal(0);
    let quoteVolume = new Prisma.Decimal(0);
    let high: Prisma.Decimal | null = null;
    let low: Prisma.Decimal | null = null;

    for (const trade of trades24h) {
      volume = volume.plus(trade.quantity);
      quoteVolume = quoteVolume.plus(trade.total);
      if (high === null || trade.price.gt(high)) high = trade.price;
      if (low === null || trade.price.lt(low)) low = trade.price;
    }

    const vwap = volume.gt(0) ? quoteVolume.div(volume) : null;

    const bestBid = bestBidOrder?.price?.toString() || null;
    const bestAsk = bestAskOrder?.price?.toString() || null;

    let spread: string | null = null;
    if (bestBid && bestAsk) {
      spread = new Prisma.Decimal(bestAsk)
        .minus(new Prisma.Decimal(bestBid))
        .toString();
    }

    return {
      tradingPairId: tradingPair.id,
      symbol: tradingPair.symbol,
      lastPrice: lastTrade ? lastTrade.price.toString() : null,
      volume24h: volume.toString(),
      tradeCount24h: trades24h.length,
      high24h: high ? high.toString() : null,
      low24h: low ? low.toString() : null,
      vwap24h: vwap ? vwap.toString() : null,
      bestBid,
      bestAsk,
      spread,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // Market Data: All Markets Summary
  // ============================================================

  /**
   * Returns market summaries for all active trading pairs.
   */
  async getAllMarketSummaries() {
    const activePairs = await this.prisma.tradingPair.findMany({
      where: {
        status: TradingPairStatus.ACTIVE,
        isActive: true,
      },
      orderBy: { symbol: 'asc' },
    });

    const summaries: MarketSummary[] = [];

    for (const pair of activePairs) {
      try {
        const summary = await this.getMarketSummary({
          tradingPairId: pair.id,
        });
        summaries.push(summary);
      } catch (error) {
        this.logger.warn(
          `Failed to compute market summary for ${pair.symbol}: ${(error as Error).message}`,
        );
      }
    }

    return {
      data: summaries,
      meta: {
        total: summaries.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Aggregates open orders by price level for a given side.
   * Groups remaining quantity and counts orders at each price point.
   */
  private async getAggregatedLevels(
    tradingPairId: string,
    side: OrderSide,
    depth: number,
    priceOrder: 'asc' | 'desc',
  ): Promise<OrderBookLevel[]> {
    const orders = await this.prisma.platformOrder.findMany({
      where: {
        tradingPairId,
        side,
        status: {
          in: [
            PlatformOrderStatus.PENDING,
            PlatformOrderStatus.PARTIALLY_FILLED,
          ],
        },
        remainingQuantity: { gt: 0 },
        price: { not: null },
      },
      select: {
        price: true,
        remainingQuantity: true,
      },
      orderBy: { price: priceOrder },
    });

    // Aggregate by price level
    const levelMap = new Map<
      string,
      { quantity: Prisma.Decimal; count: number }
    >();

    for (const order of orders) {
      const priceKey = order.price!.toString();
      const existing = levelMap.get(priceKey);

      if (existing) {
        existing.quantity = existing.quantity.plus(order.remainingQuantity);
        existing.count += 1;
      } else {
        levelMap.set(priceKey, {
          quantity: new Prisma.Decimal(order.remainingQuantity),
          count: 1,
        });
      }
    }

    // Convert to sorted array and apply depth limit
    const levels: OrderBookLevel[] = [];

    for (const [price, data] of levelMap.entries()) {
      levels.push({
        price,
        quantity: data.quantity.toString(),
        orderCount: data.count,
      });
    }

    return levels.slice(0, depth);
  }

  /**
   * Builds depth levels with cumulative quantities and total (price * quantity).
   */
  private buildDepthLevels(levels: OrderBookLevel[]): MarketDepthLevel[] {
    let cumulativeQty = new Prisma.Decimal(0);

    return levels.map((level) => {
      const qty = new Prisma.Decimal(level.quantity);
      const price = new Prisma.Decimal(level.price);
      cumulativeQty = cumulativeQty.plus(qty);

      return {
        price: level.price,
        quantity: level.quantity,
        total: price.mul(qty).toString(),
        cumulativeQuantity: cumulativeQty.toString(),
        orderCount: level.orderCount,
      };
    });
  }

  /**
   * Fetches individual open orders for a given side (no aggregation).
   */
  private async getOpenOrders(
    tradingPairId: string,
    symbol: string,
    side: OrderSide,
    limit: number,
  ) {
    const orders = await this.prisma.platformOrder.findMany({
      where: {
        tradingPairId,
        side,
        status: {
          in: [
            PlatformOrderStatus.PENDING,
            PlatformOrderStatus.PARTIALLY_FILLED,
          ],
        },
        remainingQuantity: { gt: 0 },
        price: { not: null },
      },
      select: {
        id: true,
        side: true,
        type: true,
        status: true,
        price: true,
        quantity: true,
        filledQuantity: true,
        remainingQuantity: true,
        createdAt: true,
      },
      orderBy: [
        { price: side === OrderSide.BUY ? 'desc' : 'asc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    return {
      tradingPairId,
      symbol,
      side,
      data: orders,
      meta: {
        total: orders.length,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
