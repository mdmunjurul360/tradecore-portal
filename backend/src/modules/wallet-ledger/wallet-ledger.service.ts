import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, TransactionType, TransactionStatus } from '@prisma/client';

export interface ExecuteWalletTransactionParams {
  walletId: string;
  amount: number | string | Prisma.Decimal;
  currency: string;
  type: TransactionType;
  status?: TransactionStatus;
  reference: string;
  description?: string;
  providerId?: string;
  metadata?: any;
}

@Injectable()
export class WalletLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a completely atomic financial transaction across the Wallet, Transaction, and Ledger models.
   * This guarantees that a balance is never updated without a corresponding ledger entry and transaction record.
   */
  async executeAtomicWalletTransaction(
    params: ExecuteWalletTransactionParams,
    txClient?: Prisma.TransactionClient,
  ) {
    const amountDec = new Prisma.Decimal(params.amount);
    
    if (amountDec.lte(0)) {
      throw new BadRequestException('Transaction amount must be strictly positive');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Validate wallet state
      const wallet = await tx.wallet.findUnique({
        where: { id: params.walletId },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      if (wallet.isLocked) {
        throw new BadRequestException('Wallet is currently locked for transactions');
      }

      if (wallet.currency !== params.currency) {
        throw new BadRequestException(`Currency mismatch. Expected ${wallet.currency}, got ${params.currency}`);
      }

      // 2. Validate debits for sufficient balance
      // Types that decrease balance
      const isDebit = params.type === TransactionType.WITHDRAWAL || params.type === TransactionType.FEE;
      
      if (isDebit && wallet.balance.lt(amountDec)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // 3. Create core Transaction record
      const transaction = await tx.transaction.create({
        data: {
          reference: params.reference,
          walletId: params.walletId,
          type: params.type,
          status: params.status || TransactionStatus.COMPLETED,
          amount: amountDec,
          currency: params.currency,
          netAmount: amountDec, // Can be adjusted by callers if fees apply
          providerId: params.providerId,
          metadata: params.metadata ? (params.metadata as any) : undefined,
        },
      });

      // 4. Create Ledger Entry for the User Wallet
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: wallet.id,
          direction: isDebit ? 'DEBIT' : 'CREDIT',
          amount: amountDec,
          currency: params.currency,
          description: params.description || `${params.type} transaction`,
        },
      });

      // 5. Update Wallet Balance (Only if the transaction is COMPLETED)
      // Pending transactions (like withdrawals awaiting review) do not deduct balance immediately
      // in some architectures, but often they deduct 'available balance'. We keep it simple here.
      let updatedWallet = wallet;
      
      if (transaction.status === TransactionStatus.COMPLETED) {
        const updatedBalance = isDebit 
          ? wallet.balance.minus(amountDec) 
          : wallet.balance.plus(amountDec);

        updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: updatedBalance },
        });
      }

      return {
        transaction,
        ledgerEntry,
        wallet: updatedWallet,
      };
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }

  /**
   * Helper method to securely credit a wallet.
   */
  async creditWallet(
    params: Omit<ExecuteWalletTransactionParams, 'type'> & { type?: TransactionType },
    txClient?: Prisma.TransactionClient,
  ) {
    return this.executeAtomicWalletTransaction(
      {
        ...params,
        type: params.type || TransactionType.DEPOSIT,
      },
      txClient,
    );
  }

  /**
   * Helper method to securely debit a wallet.
   */
  async debitWallet(
    params: Omit<ExecuteWalletTransactionParams, 'type'> & { type?: TransactionType },
    txClient?: Prisma.TransactionClient,
  ) {
    return this.executeAtomicWalletTransaction(
      {
        ...params,
        type: params.type || TransactionType.WITHDRAWAL,
      },
      txClient,
    );
  }

  /**
   * Locks funds in a user's wallet (e.g. when placing a BUY order with fiat/quote currency).
   * Moves amount from balance to lockedBalance atomically.
   */
  async lockWalletFunds(
    params: {
      userId: string;
      currency: string;
      amount: number | string | Prisma.Decimal;
    },
    txClient?: Prisma.TransactionClient,
  ) {
    const amountDec = new Prisma.Decimal(params.amount);
    if (amountDec.lte(0)) {
      throw new BadRequestException('Lock amount must be strictly positive');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId: params.userId,
            currency: params.currency.toUpperCase(),
          },
        },
      });

      if (!wallet) {
        throw new BadRequestException(
          `Wallet not found for currency ${params.currency.toUpperCase()}`,
        );
      }

      if (wallet.isLocked) {
        throw new BadRequestException('Wallet is currently locked for transactions');
      }

      if (wallet.balance.lt(amountDec)) {
        throw new BadRequestException(
          `Insufficient available balance in ${params.currency.toUpperCase()} wallet. Available: ${wallet.balance}, Required: ${amountDec}`,
        );
      }

      return tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance.minus(amountDec),
          lockedBalance: wallet.lockedBalance.plus(amountDec),
        },
      });
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }

  /**
   * Unlocks funds in a user's wallet (e.g. when cancelling a BUY order).
   * Moves amount from lockedBalance back to balance atomically.
   */
  async unlockWalletFunds(
    params: {
      userId: string;
      currency: string;
      amount: number | string | Prisma.Decimal;
    },
    txClient?: Prisma.TransactionClient,
  ) {
    const amountDec = new Prisma.Decimal(params.amount);
    if (amountDec.lte(0)) {
      throw new BadRequestException('Unlock amount must be strictly positive');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId: params.userId,
            currency: params.currency.toUpperCase(),
          },
        },
      });

      if (!wallet) {
        throw new BadRequestException(
          `Wallet not found for currency ${params.currency.toUpperCase()}`,
        );
      }

      if (wallet.lockedBalance.lt(amountDec)) {
        throw new BadRequestException(
          `Cannot unlock more than currently locked. Locked: ${wallet.lockedBalance}, Requested: ${amountDec}`,
        );
      }

      return tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance.plus(amountDec),
          lockedBalance: wallet.lockedBalance.minus(amountDec),
        },
      });
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }

  /**
   * Settles previously locked funds in a user's wallet (e.g. when a BUY order is filled).
   * Deducts amount directly from lockedBalance without affecting available balance.
   */
  async settleWalletFunds(
    params: {
      userId: string;
      currency: string;
      amount: number | string | Prisma.Decimal;
    },
    txClient?: Prisma.TransactionClient,
  ) {
    const amountDec = new Prisma.Decimal(params.amount);
    if (amountDec.lte(0)) {
      throw new BadRequestException('Settle amount must be strictly positive');
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId: params.userId,
            currency: params.currency.toUpperCase(),
          },
        },
      });

      if (!wallet) {
        throw new BadRequestException(
          `Wallet not found for currency ${params.currency.toUpperCase()}`,
        );
      }

      if (wallet.lockedBalance.lt(amountDec)) {
        throw new BadRequestException(
          `Insufficient locked balance for settlement. Locked: ${wallet.lockedBalance}, Settle: ${amountDec}`,
        );
      }

      return tx.wallet.update({
        where: { id: wallet.id },
        data: {
          lockedBalance: wallet.lockedBalance.minus(amountDec),
        },
      });
    };

    if (txClient) {
      return execute(txClient);
    }

    return this.prisma.$transaction(execute);
  }
}
