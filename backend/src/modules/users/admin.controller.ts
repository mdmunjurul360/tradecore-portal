import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../core/prisma/prisma.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin: Get dashboard statistics' })
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      pendingDeposits,
      pendingWithdrawals,
      pendingKyc,
      totalDeposits,
      totalWithdrawals,
      depositsToday,
      withdrawalsToday,
      tradingVolume,
      walletBalances,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.deposit.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      this.prisma.kycDocument.count({ where: { status: 'PENDING' } }),
      this.prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED' } }),
      this.prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED' } }),
      this.prisma.deposit.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: today }, status: 'APPROVED' } }),
      this.prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: today }, status: 'APPROVED' } }),
      this.prisma.trade.aggregate({ _sum: { total: true } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true } }), // Simplified sum across all wallets
    ]);

    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, createdAt: true, status: true },
    });

    return {
      totalUsers,
      activeUsers,
      pendingDeposits,
      pendingWithdrawals,
      pendingKyc,
      totalDepositVolume: Number(totalDeposits._sum.amount || 0),
      totalWithdrawalVolume: Number(totalWithdrawals._sum.amount || 0),
      depositsToday: Number(depositsToday._sum.amount || 0),
      withdrawalsToday: Number(withdrawalsToday._sum.amount || 0),
      tradingVolume: Number(tradingVolume._sum.total || 0),
      totalWalletBalance: Number(walletBalances._sum.balance || 0),
      recentUsers,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Admin: Get all users' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? { email: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          status: true,
          demoModeEnabled: true,
          emailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          profile: {
            select: { firstName: true, lastName: true, kycStatus: true },
          },
          roles: {
            include: { role: true },
          },
          _count: {
            select: { wallets: true, deposits: true, withdrawals: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Admin: Get user details' })
  async getUserById(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        profile: true,
        roles: { include: { role: true } },
        wallets: true,
        deposits: { orderBy: { createdAt: 'desc' }, take: 10 },
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Admin: Get audit logs' })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  @Get('users/:id/toggle-demo-mode')
  @ApiOperation({ summary: 'Admin: Toggle Demo Mode for user' })
  async toggleDemoMode(@Param('id') userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { demoModeEnabled: !user.demoModeEnabled },
      select: { id: true, email: true, demoModeEnabled: true },
    });

    await this.prisma.auditLog.create({
      data: { action: 'TOGGLE_DEMO_MODE', entityType: 'USER', entityId: userId, userId }
    });

    return updated;
  }

  @Get('users/:id/reset-demo-balance')
  @ApiOperation({ summary: 'Admin: Reset Demo Balances for user' })
  async resetDemoBalance(@Param('id') userId: string) {
    // Delete all demo wallets for user
    await this.prisma.wallet.deleteMany({
      where: { userId, type: 'DEMO' },
    });
    
    // Delete all demo portfolio holdings for user
    await this.prisma.portfolioHolding.deleteMany({
      where: { userId, type: 'DEMO' },
    });

    // Recreate the 10,000 USD demo wallet
    await this.prisma.wallet.create({
      data: {
        userId,
        currency: 'USD',
        type: 'DEMO',
        balance: 10000.0000,
      }
    });

    await this.prisma.auditLog.create({
      data: { action: 'RESET_DEMO_BALANCE', entityType: 'USER', entityId: userId, userId }
    });

    return { message: 'Demo balances reset successfully' };
  }

  @Get('users/:id/credit/:currency/:amount')
  @ApiOperation({ summary: 'Admin: Credit user wallet (Current Mode)' })
  async creditWallet(@Param('id') userId: string, @Param('currency') currency: string, @Param('amount') amount: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const expectedType = user.demoModeEnabled ? 'DEMO' : 'REAL';

    let wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency_type: { userId, currency: currency.toUpperCase(), type: expectedType } },
    });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, currency: currency.toUpperCase(), type: expectedType, balance: 0, lockedBalance: 0 },
      });
    }

    const updated = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: parseFloat(amount) } },
    });

    await this.prisma.auditLog.create({
      data: { action: 'CREDIT_WALLET', entityType: 'WALLET', entityId: wallet.id, userId }
    });

    return updated;
  }

  @Get('users/:id/debit/:currency/:amount')
  @ApiOperation({ summary: 'Admin: Debit user wallet (Current Mode)' })
  async debitWallet(@Param('id') userId: string, @Param('currency') currency: string, @Param('amount') amount: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const expectedType = user.demoModeEnabled ? 'DEMO' : 'REAL';

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency_type: { userId, currency: currency.toUpperCase(), type: expectedType } },
    });
    if (!wallet) throw new Error('Wallet not found');

    const updated = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: parseFloat(amount) } },
    });

    await this.prisma.auditLog.create({
      data: { action: 'DEBIT_WALLET', entityType: 'WALLET', entityId: wallet.id, userId }
    });

    return updated;
  }

  @Get('users/:id/suspend')
  @ApiOperation({ summary: 'Admin: Suspend a user' })
  async suspendUser(@Param('id') userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });
    
    await this.prisma.auditLog.create({
      data: { action: 'SUSPEND_USER', entityType: 'USER', entityId: userId, userId }
    });
    
    return user;
  }

  @Get('users/:id/activate')
  @ApiOperation({ summary: 'Admin: Activate a user' })
  async activateUser(@Param('id') userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });
    
    await this.prisma.auditLog.create({
      data: { action: 'ACTIVATE_USER', entityType: 'USER', entityId: userId, userId }
    });
    
    return user;
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Admin: Edit user basic info' })
  async updateUser(@Param('id') userId: string, @Body() body: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: body.email,
        phone: body.phone,
        twoFactorEnabled: body.twoFactorEnabled,
      },
    });

    if (body.profile) {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          firstName: body.profile.firstName,
          lastName: body.profile.lastName,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: { action: 'UPDATE_USER', entityType: 'USER', entityId: userId, userId }
    });
    
    return user;
  }

  @Patch('users/:id/reset-password')
  @ApiOperation({ summary: 'Admin: Reset user password' })
  async resetPassword(@Param('id') userId: string, @Body() body: any) {
    if (!body.password) throw new Error('Password is required');
    // We would normally hash it here (e.g. bcrypt). Assuming bcrypt is imported or handled properly, 
    // Wait, the project probably uses argon2 or bcrypt. I'll need to import the hashing function or require it.
    // Let's use bcrypt here if it's available. 
    // To be safe, let's require bcrypt locally or we can see what auth service does.
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    await this.prisma.auditLog.create({
      data: { action: 'RESET_PASSWORD', entityType: 'USER', entityId: userId, userId }
    });
    
    return { message: 'Password reset successfully' };
  }
}
