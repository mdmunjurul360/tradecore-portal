import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IBlockchainProvider } from './interfaces/blockchain-provider.interface';
import { MockProvider } from './providers/mock.provider';
import { BlockCypherProvider } from './providers/blockcypher.provider';
import { AlchemyProvider } from './providers/alchemy.provider';
import { TatumProvider } from './providers/tatum.provider';
import { NowNodesProvider } from './providers/nownodes.provider';
import { LocalCryptoProvider } from './providers/local.provider';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private providers: Map<string, IBlockchainProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mockProvider: MockProvider,
    private readonly blockCypherProvider: BlockCypherProvider,
    private readonly alchemyProvider: AlchemyProvider,
    private readonly tatumProvider: TatumProvider,
    private readonly nowNodesProvider: NowNodesProvider,
    private readonly localProvider: LocalCryptoProvider,
  ) {}

  private async getProviderForNetwork(networkId: string): Promise<IBlockchainProvider> {
    // Check if network exists
    const network = await this.prisma.network.findUnique({ where: { id: networkId } });
    if (!network) {
      throw new BadRequestException(`Network ${networkId} not found`);
    }

    // Determine the provider based on environment variables or network symbol
    // For now, if we don't have API keys, default to MockProvider
    const useMock = this.configService.get<string>('USE_MOCK_BLOCKCHAIN', 'false') === 'true';
    if (useMock) {
      return this.mockProvider;
    }

    // Default to our LocalCryptoProvider which generates real addresses natively
    switch (network.symbol) {
      case 'BTC':
      case 'LTC':
      case 'DOGE':
        return this.configService.get('BLOCKCYPHER_KEY') ? this.blockCypherProvider : this.localProvider;
      case 'ETH':
      case 'POLYGON':
        return this.configService.get('ALCHEMY_KEY') ? this.alchemyProvider : this.localProvider;
      case 'TRX':
      case 'BNB':
      case 'SOL':
        return this.configService.get('NOWNODES_KEY') ? this.nowNodesProvider : this.localProvider;
      default:
        // Use localProvider for any token like USDT too
        return this.localProvider;
    }
  }

  async generateWallet(networkId: string) {
    const provider = await this.getProviderForNetwork(networkId);
    // Passing network.symbol as the hint for LocalCryptoProvider since networkId is UUID
    const network = await this.prisma.network.findUnique({ where: { id: networkId } });
    return provider.generateWallet(network?.symbol || networkId);
  }

  async validateAddress(address: string, networkId: string) {
    const provider = await this.getProviderForNetwork(networkId);
    return provider.validateAddress(address, networkId);
  }

  async getBalance(address: string, networkId: string) {
    const provider = await this.getProviderForNetwork(networkId);
    const network = await this.prisma.network.findUnique({ where: { id: networkId } });
    return provider.getBalance(address, network?.symbol || networkId);
  }

  async getTransaction(txHash: string, networkId: string) {
    const provider = await this.getProviderForNetwork(networkId);
    return provider.getTransaction(txHash, networkId);
  }

  async broadcastTransaction(signedTx: string, networkId: string) {
    const provider = await this.getProviderForNetwork(networkId);
    return provider.broadcastTransaction(signedTx, networkId);
  }

  async getLatestBlock(networkId: string) {
    const provider = await this.getProviderForNetwork(networkId);
    return provider.getLatestBlock(networkId);
  }

  async getConfirmations(txHash: string, networkId: string) {
    const provider = await this.getProviderForNetwork(networkId);
    return provider.getConfirmations(txHash, networkId);
  }
}

