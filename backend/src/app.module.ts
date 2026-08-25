import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bullmq';
import { envValidationSchema } from './common/config/env.validation';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisConfigModule } from './core/redis/redis-config.module';
import { HealthModule } from './core/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { KycModule } from './modules/kyc/kyc.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { WithdrawalModule } from './modules/withdrawal/withdrawal.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { AdminDepositModule } from './modules/admin-deposit/admin-deposit.module';
import { AdminWithdrawalModule } from './modules/admin-withdrawal/admin-withdrawal.module';
import { AdminKycModule } from './modules/admin-kyc/admin-kyc.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminUploadModule } from './modules/admin-upload/admin-upload.module';
import { NotificationModule } from './modules/notification/notification.module';

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
    HealthModule,

    // Feature Modules
    UsersModule,
    AuthModule,
    KycModule,
    WalletModule,
    TransactionModule,
    DepositModule,
    WithdrawalModule,
    LedgerModule,
    AdminDepositModule,
    AdminWithdrawalModule,
    AdminKycModule,
    UploadModule,
    AdminUploadModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
