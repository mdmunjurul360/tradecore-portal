import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [PrismaModule, WalletLedgerModule, PortfolioModule],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
