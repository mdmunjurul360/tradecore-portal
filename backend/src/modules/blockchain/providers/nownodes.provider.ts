import { Injectable, Logger } from '@nestjs/common';
import { IBlockchainProvider } from '../interfaces/blockchain-provider.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NowNodesProvider implements IBlockchainProvider {
  private readonly logger = new Logger(NowNodesProvider.name);
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NOWNODES_KEY', '');
  }

  async generateWallet(networkId: string): Promise<{ address: string; privateKeyEncrypted: string }> {
    throw new Error('Not implemented');
  }

  async validateAddress(address: string, networkId: string): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async getBalance(address: string, networkId: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async getTransaction(txHash: string, networkId: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async broadcastTransaction(signedTx: string, networkId: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async getLatestBlock(networkId: string): Promise<number> {
    throw new Error('Not implemented');
  }

  async getConfirmations(txHash: string, networkId: string): Promise<number> {
    throw new Error('Not implemented');
  }
}
