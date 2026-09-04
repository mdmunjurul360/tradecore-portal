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
import { TradingPairService } from './trading-pair.service';
import { CreateTradingPairDto } from './dto/create-trading-pair.dto';
import { UpdateTradingPairDto } from './dto/update-trading-pair.dto';
import { UpdateTradingPairStatusDto } from './dto/update-trading-pair-status.dto';
import { GetTradingPairFilterDto } from './dto/get-trading-pair-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Trading Pairs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/trading-pairs')
export class TradingPairController {
  constructor(private readonly tradingPairService: TradingPairService) {}

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new trading pair' })
  async create(@Body() dto: CreateTradingPairDto) {
    return this.tradingPairService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Admin: Get all trading pairs with filtering' })
  async findAll(@Query() filterDto: GetTradingPairFilterDto) {
    return this.tradingPairService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get a specific trading pair by ID' })
  async findOne(@Param('id') id: string) {
    return this.tradingPairService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update a trading pair' })
  async update(@Param('id') id: string, @Body() dto: UpdateTradingPairDto) {
    return this.tradingPairService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Update trading pair status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTradingPairStatusDto,
  ) {
    return this.tradingPairService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Soft delete a trading pair' })
  async remove(@Param('id') id: string) {
    return this.tradingPairService.remove(id);
  }
}
