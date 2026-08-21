import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bullmq';
import { envValidationSchema } from './common/config/env.validation';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisConfigModule } from './core/redis/redis-config.module';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envValidationSchema.parse(env),
    }),
    
    // Logging Module
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),

    // Core Modules
    PrismaModule,
    RedisConfigModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
