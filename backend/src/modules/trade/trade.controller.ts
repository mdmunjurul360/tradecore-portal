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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user trade execution history' })
  async getUserTrades(
    @CurrentUser('id') userId: string,
    @Query() filterDto: GetTradeFilterDto,
  ) {
    return this.tradeService.findAll(userId, filterDto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all platform trade executions (Admin only)' })
  async getAdminTrades(@Query() filterDto: GetTradeFilterDto) {
    return this.tradeService.findAdminAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trade details by ID' })
  async getTradeDetails(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.tradeService.findOne(id, userId);
  }
}
