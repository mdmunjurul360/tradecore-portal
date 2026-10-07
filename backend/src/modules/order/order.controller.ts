import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { GetOrderFilterDto } from './dto/get-order-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  async create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    try {
      const result = await this.orderService.create(user.id, dto, user.demoModeEnabled);
      return result;
    } catch (e: any) {
      throw e;
    }
  }

  @Get('open')
  @ApiOperation({ summary: 'Get all open orders for the current user' })
  async getOpenOrders(@CurrentUser() user: User, @Query('pair') pair?: string) {
    return this.orderService.getOpenOrders(user.id, pair, user.demoModeEnabled);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get order history for the current user' })
  async getOrderHistory(@CurrentUser() user: User, @Query('pair') pair?: string) {
    return this.orderService.getOrderHistory(user.id, pair, user.demoModeEnabled);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user orders' })
  async findAll(@CurrentUser() user: User, @Query() filterDto: GetOrderFilterDto) {
    return this.orderService.findAll(user.id, filterDto, user.demoModeEnabled);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.orderService.findOne(user.id, id, user.demoModeEnabled);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending or partially filled order' })
  async cancelOrder(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('currentPrice') currentPrice?: string,
  ) {
    return this.orderService.cancel(user.id, id, user.demoModeEnabled, currentPrice ? parseFloat(currentPrice) : undefined);
  }
}

