import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { GetTransactionsFilterDto } from './dto/get-transactions-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user transactions with pagination and filtering' })
  async findAll(
    @CurrentUser() user: User,
    @Query() filterDto: GetTransactionsFilterDto,
  ) {
    return this.transactionService.findAll(user.id, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionService.findOne(user.id, id);
  }
}
