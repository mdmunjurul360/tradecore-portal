import {
  Controller,
  Get,
  Post,
  Patch,
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
    return this.orderService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user orders' })
  async findAll(@CurrentUser() user: User, @Query() filterDto: GetOrderFilterDto) {
    return this.orderService.findAll(user.id, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.orderService.findOne(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending or partially filled order' })
  async cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
  ) {
    return this.orderService.cancel(user.id, id);
  }
}
