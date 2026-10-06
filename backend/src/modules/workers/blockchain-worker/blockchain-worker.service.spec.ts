import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainWorkerService } from './blockchain-worker.service';

describe('BlockchainWorkerService', () => {
  let service: BlockchainWorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainWorkerService],
    }).compile();

    service = module.get<BlockchainWorkerService>(BlockchainWorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
