import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // This is where we would inject a generic Redis Client or CacheManager 
    // for use-cases outside of BullMQ (like quick KV lookups for rates).
  ],
  exports: [],
})
export class RedisConfigModule {}
