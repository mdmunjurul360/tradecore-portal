import { Injectable, Logger } from '@nestjs/common';
import { IBlockchainProvider } from '../interfaces/blockchain-provider.interface';
import { randomBytes } from 'crypto';

@Injectable()
export class MockProvider implements IBlockchainProvider {
  private readonly logger = new Logger(MockProvider.name);

  async generateWallet(networkId: string): Promise<{ address: string; privateKeyEncrypted: string }> {
    this.logger.debug(`Generating mock wallet for network ${networkId}`);
    return {
      address: `mock_addr_${randomBytes(16).toString('hex')}`,
      privateKeyEncrypted: `enc_mock_pk_${randomBytes(16).toString('hex')}`,
    };
  }

  async validateAddress(address: string, networkId: string): Promise<boolean> {
    this.logger.debug(`Validating address ${address} on network ${networkId}`);
    return address.startsWith('mock_addr_') || address.length > 20;
  }

  async getBalance(address: string, networkId: string): Promise<string> {
    this.logger.debug(`Getting balance for address ${address} on network ${networkId}`);
    return '0.0000';
  }

  async getTransaction(txHash: string, networkId: string): Promise<any> {
    this.logger.debug(`Getting transaction ${txHash} on network ${networkId}`);
    return {
      txHash,
      status: 'CONFIRMED',
      confirmations: 10,
    };
  }

  async broadcastTransaction(signedTx: string, networkId: string): Promise<string> {
    this.logger.debug(`Broadcasting tx on network ${networkId}`);
    return `mock_tx_${randomBytes(16).toString('hex')}`;
  }

  async getLatestBlock(networkId: string): Promise<number> {
    return Math.floor(Date.now() / 1000);
  }

  async getConfirmations(txHash: string, networkId: string): Promise<number> {
    return 10; // Mock always has enough confirmations
  }
}
