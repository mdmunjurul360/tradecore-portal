import { Module } from '@nestjs/common';
import { BlockchainWorkerService } from './blockchain-worker/blockchain-worker.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module';

@Module({
  imports: [PrismaModule, BlockchainModule, WalletLedgerModule],
  providers: [BlockchainWorkerService]
})
export class WorkersModule {}
