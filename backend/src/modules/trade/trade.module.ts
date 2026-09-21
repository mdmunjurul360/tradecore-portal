import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NotificationModule } from '../notification/notification.module';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';

@Module({
  imports: [
    PrismaModule,
    WalletLedgerModule,
    PortfolioModule,
    NotificationModule,
  ],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}
