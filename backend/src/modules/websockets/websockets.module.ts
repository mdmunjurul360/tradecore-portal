import { Module } from '@nestjs/common';
import { TradingGateway } from './trading/trading.gateway';

@Module({
  providers: [TradingGateway],
  exports: [TradingGateway]
})
export class WebsocketsModule {}
