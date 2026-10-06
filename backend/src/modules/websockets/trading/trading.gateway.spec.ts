import { Test, TestingModule } from '@nestjs/testing';
import { TradingGateway } from './trading.gateway';

describe('TradingGateway', () => {
  let gateway: TradingGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TradingGateway],
    }).compile();

    gateway = module.get<TradingGateway>(TradingGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
