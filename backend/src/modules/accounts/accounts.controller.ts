import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountsService } from './accounts.service';

@ApiTags('Trading Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List trading accounts' })
  list(@CurrentUser() user: User, @Query('includeArchived') includeArchived?: string) {
    return this.accountsService.list(user.id, includeArchived !== 'false');
  }

  @Post()
  @ApiOperation({ summary: 'Open a new trading account' })
  create(
    @CurrentUser() user: User,
    @Body() body: { type: 'DEMO' | 'LIVE' | 'REAL'; accountClass?: 'STANDARD' | 'PRO'; leverage?: number; name?: string },
  ) {
    return this.accountsService.create(user.id, body);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Internal transfer between trading accounts' })
  transfer(@CurrentUser() user: User, @Body() body: { fromAccountId: string; toAccountId: string; amount: number }) {
    return this.accountsService.transfer(user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trading account details' })
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.get(user.id, id);
  }

  @Patch(':id/rename')
  @ApiOperation({ summary: 'Rename trading account' })
  rename(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { name: string }) {
    return this.accountsService.rename(user.id, id, body?.name);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive trading account' })
  archive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.archive(user.id, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore archived trading account' })
  restore(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.restore(user.id, id);
  }

  @Post(':id/switch')
  @ApiOperation({ summary: 'Make this the active trading account' })
  switch(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.switchAccount(user.id, id);
  }

  @Post(':id/demo-topup')
  @ApiOperation({ summary: 'Instantly add virtual funds to a demo account' })
  demoTopUp(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { amount: number }) {
    return this.accountsService.demoTopUp(user.id, id, body?.amount);
  }
}
