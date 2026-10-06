import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
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
import { WalletLedgerModule } from './modules/wallet-ledger/wallet-ledger.module';
import { TradingPairModule } from './modules/trading-pair/trading-pair.module';
import { OrderModule } from './modules/order/order.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { MatchingEngineModule } from './modules/matching-engine/matching-engine.module';
import { TradeModule } from './modules/trade/trade.module';
import { OrderBookModule } from './modules/order-book/order-book.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { ReferralModule } from './modules/referral/referral.module';
import { SessionModule } from './modules/session/session.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { WorkersModule } from './modules/workers/workers.module';
import { WebsocketsModule } from './modules/websockets/websockets.module';
import { AccountsModule } from './modules/accounts/accounts.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envValidationSchema.parse(env),
    }),
    
    ScheduleModule.forRoot(),
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
    WalletLedgerModule,
    TradingPairModule,
    OrderModule,
    PortfolioModule,
    MatchingEngineModule,
    TradeModule,
    OrderBookModule,
    ApiKeysModule,
    ReferralModule,
    SessionModule,
    BlockchainModule,
    WorkersModule,
    WebsocketsModule,
    AccountsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute by default
    }]),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
