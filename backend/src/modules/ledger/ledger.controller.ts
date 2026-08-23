import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { GetLedgerFilterDto } from './dto/get-ledger-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @ApiOperation({ summary: 'Get ledger history for the authenticated user' })
  async findAll(
    @CurrentUser() user: User,
    @Query() filterDto: GetLedgerFilterDto,
  ) {
    return this.ledgerService.findAll(user.id, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific ledger entry by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ledgerService.findOne(user.id, id);
  }
}
