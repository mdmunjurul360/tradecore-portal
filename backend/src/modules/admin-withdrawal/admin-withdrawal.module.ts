import { Module } from '@nestjs/common';
import { AdminWithdrawalService } from './admin-withdrawal.service';
import { AdminWithdrawalController } from './admin-withdrawal.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, WalletLedgerModule, NotificationModule],
  controllers: [AdminWithdrawalController],
  providers: [AdminWithdrawalService],
})
export class AdminWithdrawalModule {}
