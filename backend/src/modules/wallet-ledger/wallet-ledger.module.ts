import { Module } from '@nestjs/common';
import { WalletLedgerService } from './wallet-ledger.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WalletLedgerService],
  exports: [WalletLedgerService],
})
export class WalletLedgerModule {}
