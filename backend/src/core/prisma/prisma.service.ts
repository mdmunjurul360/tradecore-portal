import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: Logger) {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing Prisma database connection...');
    await this.$connect();
    this.logger.log('Prisma database connection established.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma database connection closed.');
  }
}
