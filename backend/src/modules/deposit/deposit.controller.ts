import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepositService } from './deposit.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { GetDepositsFilterDto } from './dto/get-deposits-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Deposits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deposit request' })
  async createDeposit(
    @CurrentUser() user: User,
    @Body() createDepositDto: CreateDepositDto,
  ) {
    return this.depositService.createDeposit(user.id, createDepositDto);
  }

  @Get('address/:currency/:networkId')
  @ApiOperation({ summary: 'Get or generate a deposit address for a specific currency and network' })
  async getAddress(
    @CurrentUser() user: User,
    @Param('currency') currency: string,
    @Param('networkId') networkId: string,
  ) {
    return this.depositService.getDepositAddress(user.id, currency, networkId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user deposit requests' })
  async findAll(
    @CurrentUser() user: User,
    @Query() filterDto: GetDepositsFilterDto,
  ) {
    return this.depositService.findAll(user.id, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific deposit request by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.depositService.findOne(user.id, id);
  }
}
