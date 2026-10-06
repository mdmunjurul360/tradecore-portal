import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TradeService } from './trade.service';
import { GetTradeFilterDto } from './dto/get-trade-filter.dto';

@ApiTags('trades')
@Controller('trades')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user trade execution history' })
  async getUserTrades(
    @CurrentUser() user: any,
    @Query() filterDto: GetTradeFilterDto,
  ) {
    return this.tradeService.findAll(user.id, filterDto, user.demoModeEnabled);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all platform trade executions (Admin only)' })
  async getAdminTrades(@Query() filterDto: GetTradeFilterDto) {
    return this.tradeService.findAdminAll(filterDto);
  }

  @Get('public/:pair')
  @ApiOperation({ summary: 'Get public trade history for a pair' })
  async getPublicTrades(@Param('pair') pair: string) {
    return this.tradeService.getPublicTrades(pair);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trade details by ID' })
  async getTradeDetails(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.tradeService.findOne(id, user.id, user.demoModeEnabled);
  }
}

