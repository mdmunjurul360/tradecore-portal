import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrderBookService } from './order-book.service';
import { GetOrderBookDto } from './dto/get-order-book.dto';
import { GetMarketDataDto } from './dto/get-market-data.dto';

@ApiTags('order-book')
@Controller('order-book')
export class OrderBookController {
  constructor(private readonly orderBookService: OrderBookService) {}

  // ============================================================
  // Order Book Endpoints
  // ============================================================

  @Get()
  @ApiOperation({ summary: 'Get full order book for a trading pair' })
  async getOrderBook(@Query() dto: GetOrderBookDto) {
    return this.orderBookService.getOrderBook(dto);
  }

  @Get('best-bid-ask')
  @ApiOperation({ summary: 'Get best bid and best ask for a trading pair' })
  async getBestBidAsk(@Query() dto: GetMarketDataDto) {
    return this.orderBookService.getBestBidAsk(dto);
  }

  @Get('depth')
  @ApiOperation({ summary: 'Get market depth with cumulative quantities' })
  async getMarketDepth(@Query() dto: GetOrderBookDto) {
    return this.orderBookService.getMarketDepth(dto);
  }

  @Get('buy-orders')
  @ApiOperation({ summary: 'Get open BUY orders for a trading pair' })
  async getOpenBuyOrders(@Query() dto: GetOrderBookDto) {
    return this.orderBookService.getOpenBuyOrders(dto);
  }

  @Get('sell-orders')
  @ApiOperation({ summary: 'Get open SELL orders for a trading pair' })
  async getOpenSellOrders(@Query() dto: GetOrderBookDto) {
    return this.orderBookService.getOpenSellOrders(dto);
  }

  // ============================================================
  // Market Data Endpoints
  // ============================================================

  @Get('last-price')
  @ApiOperation({ summary: 'Get last traded price for a trading pair' })
  async getLastTradedPrice(@Query() dto: GetMarketDataDto) {
    return this.orderBookService.getLastTradedPrice(dto);
  }

  @Get('24h-stats')
  @ApiOperation({ summary: 'Get 24-hour trading statistics for a trading pair' })
  async get24hStats(@Query() dto: GetMarketDataDto) {
    return this.orderBookService.get24hStats(dto);
  }

  @Get('market-summary')
  @ApiOperation({ summary: 'Get comprehensive market summary for a trading pair' })
  async getMarketSummary(@Query() dto: GetMarketDataDto) {
    return this.orderBookService.getMarketSummary(dto);
  }

  @Get('markets')
  @ApiOperation({ summary: 'Get market summaries for all active trading pairs' })
  async getAllMarketSummaries() {
    return this.orderBookService.getAllMarketSummaries();
  }
}
