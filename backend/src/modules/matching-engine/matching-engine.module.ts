import { Module } from '@nestjs/common';
import { MatchingEngineService } from './matching-engine.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, WalletLedgerModule, PortfolioModule, NotificationModule],
  providers: [MatchingEngineService],
  exports: [MatchingEngineService],
})
export class MatchingEngineModule {}
