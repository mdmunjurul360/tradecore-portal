import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { MockProvider } from './providers/mock.provider';
import { BlockCypherProvider } from './providers/blockcypher.provider';
import { AlchemyProvider } from './providers/alchemy.provider';
import { TatumProvider } from './providers/tatum.provider';
import { NowNodesProvider } from './providers/nownodes.provider';
import { LocalCryptoProvider } from './providers/local.provider';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    BlockchainService,
    MockProvider,
    BlockCypherProvider,
    AlchemyProvider,
    TatumProvider,
    NowNodesProvider,
    LocalCryptoProvider,
  ],
  exports: [BlockchainService, LocalCryptoProvider],
})
export class BlockchainModule {}
