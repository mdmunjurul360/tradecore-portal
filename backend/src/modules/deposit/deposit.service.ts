import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { GetDepositsFilterDto } from './dto/get-deposits-filter.dto';

@Injectable()
export class DepositService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService
  ) {}

  async createDeposit(userId: string, createDepositDto: CreateDepositDto) {
    const { amount, currency, paymentMethod, reference } = createDepositDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const expectedType = user?.demoModeEnabled ? 'DEMO' : 'REAL';

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_currency_type: {
          userId,
          currency,
          type: expectedType,
        },
      },
    });

    if (!wallet) {
      throw new BadRequestException(`Wallet for currency ${currency} not found`);
    }

    if (reference) {
      const existingRef = await this.prisma.deposit.findUnique({
        where: { reference },
      });
      if (existingRef) {
        throw new BadRequestException('Transaction reference already exists');
      }
    }

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        currency,
        paymentMethod,
        reference,
        status: 'PENDING',
      },
    });

    return deposit;
  }

  async findAll(userId: string, filterDto: GetDepositsFilterDto) {
    const { status, page = 1, limit = 10 } = filterDto;
    
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return {
      data: deposits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const deposit = await this.prisma.deposit.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }

    return deposit;
  }

  async getDepositAddress(userId: string, currency: string, networkId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const expectedType = user?.demoModeEnabled ? 'DEMO' : 'REAL';

    let wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency_type: { userId, currency, type: expectedType } },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, currency, type: expectedType, balance: 0, lockedBalance: 0 },
      });
    }

    let walletAddress = await this.prisma.walletAddress.findUnique({
      where: { userId_networkId: { userId, networkId } },
    });

    if (!walletAddress) {
      const { address, privateKeyEncrypted } = await this.blockchainService.generateWallet(networkId);
      walletAddress = await this.prisma.walletAddress.create({
        data: {
          userId,
          networkId,
          address,
          privateKeyEncrypted,
        },
      });
    }

    return { address: walletAddress.address, currency, networkId };
  }
}
