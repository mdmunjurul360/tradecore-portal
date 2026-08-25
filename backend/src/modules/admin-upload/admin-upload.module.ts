import { Module } from '@nestjs/common';
import { AdminUploadService } from './admin-upload.service';
import { AdminUploadController } from './admin-upload.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminUploadController],
  providers: [AdminUploadService],
})
export class AdminUploadModule {}
