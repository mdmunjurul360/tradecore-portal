import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { MatchingEngineModule } from '../matching-engine/matching-engine.module';

@Module({
  imports: [PrismaModule, WalletLedgerModule, PortfolioModule, MatchingEngineModule],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
