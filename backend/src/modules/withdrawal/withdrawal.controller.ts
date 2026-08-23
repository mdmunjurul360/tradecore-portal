import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { GetWithdrawalsFilterDto } from './dto/get-withdrawals-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new withdrawal request' })
  async createWithdrawal(
    @CurrentUser() user: User,
    @Body() createWithdrawalDto: CreateWithdrawalDto,
  ) {
    return this.withdrawalService.createWithdrawal(user.id, createWithdrawalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user withdrawal requests' })
  async findAll(
    @CurrentUser() user: User,
    @Query() filterDto: GetWithdrawalsFilterDto,
  ) {
    return this.withdrawalService.findAll(user.id, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific withdrawal request by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.withdrawalService.findOne(user.id, id);
  }
}
