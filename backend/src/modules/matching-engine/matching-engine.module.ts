import { Module } from '@nestjs/common';
import { MatchingEngineService } from './matching-engine.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NotificationModule } from '../notification/notification.module';
import { TradeModule } from '../trade/trade.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [
    PrismaModule,
    WalletLedgerModule,
    PortfolioModule,
    NotificationModule,
    TradeModule,
    WebsocketsModule,
  ],
  providers: [MatchingEngineService],
  exports: [MatchingEngineService],
})
export class MatchingEngineModule {}
