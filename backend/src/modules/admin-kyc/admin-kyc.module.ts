import { Module } from '@nestjs/common';
import { AdminKycService } from './admin-kyc.service';
import { AdminKycController } from './admin-kyc.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminKycController],
  providers: [AdminKycService],
})
export class AdminKycModule {}
