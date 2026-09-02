import { Module } from '@nestjs/common';
import { AdminDepositService } from './admin-deposit.service';
import { AdminDepositController } from './admin-deposit.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, WalletLedgerModule, NotificationModule],
  controllers: [AdminDepositController],
  providers: [AdminDepositService],
})
export class AdminDepositModule {}
