import { Module } from '@nestjs/common';
import { AdminDepositService } from './admin-deposit.service';
import { AdminDepositController } from './admin-deposit.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminDepositController],
  providers: [AdminDepositService],
})
export class AdminDepositModule {}
