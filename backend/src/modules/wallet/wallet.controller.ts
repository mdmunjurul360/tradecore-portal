import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet information' })
  async getWallet(@CurrentUser() user: User) {
    return this.walletService.getWallet(user.id);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get current wallet balance' })
  async getBalance(@CurrentUser() user: User) {
    return this.walletService.getBalance(user.id);
  }

  @Get('networks')
  @ApiOperation({ summary: 'Get supported blockchain networks' })
  async getNetworks() {
    return this.walletService.getNetworks();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get transaction history' })
  async getHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.walletService.getHistory(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      type,
    });
  }

  @Get('address/:symbol')
  @ApiOperation({ summary: 'Get deposit address for symbol' })
  async getAddress(
    @CurrentUser() user: User,
    @Param('symbol') symbol: string,
    @Query('network') network?: string,
  ) {
    return this.walletService.getWalletAddress(user.id, network || symbol);
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Get wallet by symbol' })
  async getWalletBySymbol(@CurrentUser() user: User, @Param('symbol') symbol: string) {
    return this.walletService.getWalletBySymbol(user.id, symbol);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Submit withdrawal request' })
  async withdraw(@CurrentUser() user: User, @Body() data: { symbol: string; amount: number; destination: string; network?: string }) {
    return this.walletService.createWithdrawal(user.id, data);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer between funding and trading wallets' })
  async transfer(
    @CurrentUser() user: User,
    @Body() data: { currency: string; amount: number; from: string; to: string },
  ) {
    return this.walletService.transfer(user.id, data);
  }
}
