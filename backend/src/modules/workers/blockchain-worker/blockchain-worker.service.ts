import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { WalletLedgerService } from '../../wallet-ledger/wallet-ledger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlockchainWorkerService {
  private readonly logger = new Logger(BlockchainWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly walletLedgerService: WalletLedgerService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncDeposits() {
    this.logger.debug('Starting blockchain deposit sync...');
    try {
      const addresses = await this.prisma.walletAddress.findMany({
        where: { status: 'ACTIVE' },
        include: { network: true },
      });

      for (const addressRecord of addresses) {
        try {
          const onChainBalanceStr = await this.blockchainService.getBalance(
            addressRecord.address,
            addressRecord.networkId
          );
          
          const onChainBalance = parseFloat(onChainBalanceStr);
          if (onChainBalance <= 0) continue;

          // We check if we already processed this balance to avoid double crediting.
          // In a real system, we'd check specific UTXOs or incoming txHashes.
          // For this workflow, we'll check total deposits for this address/network.
          
          const existingDeposits = await this.prisma.deposit.aggregate({
            where: {
              userId: addressRecord.userId,
              currency: addressRecord.network.symbol,
              status: 'APPROVED',
            },
            _sum: { amount: true },
          });

          const totalCredited = existingDeposits._sum.amount ? parseFloat(existingDeposits._sum.amount.toString()) : 0;
          
          if (onChainBalance > totalCredited) {
            const newDepositAmount = onChainBalance - totalCredited;
            this.logger.log(`Detected new deposit of ${newDepositAmount} ${addressRecord.network.symbol} for user ${addressRecord.userId}`);

            await this.prisma.$transaction(async (tx) => {
              const wallet = await tx.wallet.findUnique({
                where: { userId_currency_type: { userId: addressRecord.userId, currency: addressRecord.network.symbol, type: 'REAL' } }
              });

              if (wallet) {
                // Record Deposit
                await tx.deposit.create({
                  data: {
                    userId: addressRecord.userId,
                    walletId: wallet.id,
                    amount: new Prisma.Decimal(newDepositAmount),
                    currency: addressRecord.network.symbol,
                    paymentMethod: 'CRYPTO',
                    status: 'APPROVED',
                    txHash: `tx_mock_detected_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                  }
                });

                // Credit Wallet
                await this.walletLedgerService.executeAtomicWalletTransaction({
                  walletId: wallet.id,
                  type: 'DEPOSIT',
                  amount: new Prisma.Decimal(newDepositAmount),
                  currency: addressRecord.network.symbol,
                  reference: `dep_${Date.now()}`,
                  description: 'Crypto Deposit',
                }, tx);
              }
            });
          }
        } catch (err) {
          this.logger.error(`Error syncing address ${addressRecord.address}: ${err.message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed deposit sync: ${err.message}`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingWithdrawals() {
    this.logger.debug('Starting pending withdrawals processing...');
    const pendingWithdrawals = await this.prisma.withdrawal.findMany({
      where: { status: 'PENDING', withdrawalMethod: { not: 'BANK' } } // Only crypto
    });

    for (const withdrawal of pendingWithdrawals) {
      // In a real system, an admin might approve it first. Here we auto-approve for the workflow demo.
      try {
        await this.prisma.$transaction(async (tx) => {
          // Verify it's still pending
          const w = await tx.withdrawal.findUnique({ where: { id: withdrawal.id } });
          if (w?.status !== 'PENDING') return;

          // Broadcast to blockchain
          const txHash = await this.blockchainService.broadcastTransaction('dummy_signed_tx', withdrawal.withdrawalMethod);
          
          // Mark as approved and deduct locked balance
          await tx.withdrawal.update({
            where: { id: withdrawal.id },
            data: { status: 'APPROVED', txHash }
          });

          await tx.wallet.update({
            where: { id: withdrawal.walletId },
            data: {
              lockedBalance: { decrement: withdrawal.amount }
            }
          });

          await this.walletLedgerService.executeAtomicWalletTransaction({
            walletId: withdrawal.walletId,
            type: 'WITHDRAWAL',
            amount: new Prisma.Decimal(withdrawal.amount),
            currency: withdrawal.currency,
            reference: withdrawal.id,
            description: 'Crypto Withdrawal Processed',
          }, tx);
        });
        this.logger.log(`Successfully processed withdrawal ${withdrawal.id}`);
      } catch (err) {
        this.logger.error(`Failed to process withdrawal ${withdrawal.id}: ${err.message}`);
      }
    }
  }
}
