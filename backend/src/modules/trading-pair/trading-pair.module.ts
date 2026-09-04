import { Module } from '@nestjs/common';
import { TradingPairService } from './trading-pair.service';
import { TradingPairController } from './trading-pair.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TradingPairController],
  providers: [TradingPairService],
  exports: [TradingPairService],
})
export class TradingPairModule {}
