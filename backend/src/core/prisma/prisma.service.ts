import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: Logger) {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing Prisma database connection...');
    await this.$connect();
    this.logger.log('Prisma database connection established.');

    if (process.env.NODE_ENV === 'development') {
      this.logger.log('Development mode detected. Running database seeds...');
      await this.seedDevelopmentAdmin();
      await this.seedNetworks();
    }
  }

  private async seedDevelopmentAdmin() {
    const adminEmail = 'admin@tradecore.local';
    
    try {
      // Ensure the SUPER_ADMIN role exists
      let adminRole = await this.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });

      if (!adminRole) {
        adminRole = await this.role.create({
          data: {
            name: 'SUPER_ADMIN',
            description: 'Super Administrator',
          },
        });
      }

      const adminUser = await this.user.findUnique({
        where: { email: adminEmail },
      });

      if (!adminUser) {
        // We require bcrypt for password hashing, but let's dynamically import to avoid breaking anything else
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash('Admin@123456', 10);

        await this.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            roles: {
              create: {
                roleId: adminRole.id
              }
            }
          },
        });
        this.logger.log(`Created default development admin: ${adminEmail}`);
      }
    } catch (error) {
      this.logger.error(`Failed to seed development admin: ${error.message}`);
    }
  }

  private async seedNetworks() {
    const networks = [
      { name: 'Bitcoin', symbol: 'BTC', chainId: null, rpcUrl: null, explorerUrl: 'https://blockchair.com/bitcoin/transaction/', confirmationsRequired: 3 },
      { name: 'Ethereum', symbol: 'ETH', chainId: 1, rpcUrl: 'https://cloudflare-eth.com', explorerUrl: 'https://etherscan.io/tx/', confirmationsRequired: 12 },
      { name: 'BNB Smart Chain', symbol: 'BNB', chainId: 56, rpcUrl: 'https://bsc-dataseed.binance.org', explorerUrl: 'https://bscscan.com/tx/', confirmationsRequired: 15 },
      { name: 'Tron', symbol: 'TRX', chainId: null, rpcUrl: 'https://api.trongrid.io', explorerUrl: 'https://tronscan.org/#/transaction/', confirmationsRequired: 19 },
      { name: 'USDT (ERC20)', symbol: 'USDT', chainId: 1, rpcUrl: 'https://cloudflare-eth.com', explorerUrl: 'https://etherscan.io/tx/', confirmationsRequired: 12 },
    ];

    try {
      for (const net of networks) {
        const existing = await this.network.findUnique({ where: { symbol: net.symbol } });
        if (!existing) {
          await this.network.create({ data: net });
          this.logger.log(`Seeded network: ${net.name} (${net.symbol})`);
        }
      }

      // Ensure ADMIN role exists (used by admin panels, in addition to SUPER_ADMIN)
      const adminRole = await this.role.findUnique({ where: { name: 'ADMIN' } });
      if (!adminRole) {
        await this.role.create({ data: { name: 'ADMIN', description: 'Platform Administrator' } });
        this.logger.log('Created ADMIN role');
      }

      // Assign ADMIN role to the super admin user if not already assigned
      const superAdmin = await this.user.findUnique({ where: { email: 'admin@tradecore.local' } });
      if (superAdmin && adminRole) {
        const hasAdminRole = await this.userRole.findUnique({
          where: { userId_roleId: { userId: superAdmin.id, roleId: adminRole.id } },
        });
        if (!hasAdminRole) {
          await this.userRole.create({ data: { userId: superAdmin.id, roleId: adminRole.id } });
          this.logger.log('Assigned ADMIN role to super admin user');
        }
      }
    } catch (error) {
      this.logger.error(`Failed to seed networks: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma database connection closed.');
  }
}
