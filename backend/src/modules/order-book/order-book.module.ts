import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { OrderBookService } from './order-book.service';
import { OrderBookController } from './order-book.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OrderBookController],
  providers: [OrderBookService],
  exports: [OrderBookService],
})
export class OrderBookModule {}
