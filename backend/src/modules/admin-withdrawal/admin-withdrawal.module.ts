import { Module } from '@nestjs/common';
import { AdminWithdrawalService } from './admin-withdrawal.service';
import { AdminWithdrawalController } from './admin-withdrawal.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminWithdrawalController],
  providers: [AdminWithdrawalService],
})
export class AdminWithdrawalModule {}
