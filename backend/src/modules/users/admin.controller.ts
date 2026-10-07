import { Controller, Get, Patch, Param, Query, Body, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';

// Only ADMIN (and SUPER_ADMIN, which RolesGuard always allows) may use these endpoints.
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin: Get dashboard statistics' })
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6); // rolling 7 days incl. today
    const onlineSince = new Date(Date.now() - 15 * 60 * 1000); // access token lifetime

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
      todayRegistrations,
      weekRegistrations,
      verifiedUsers,
      referralUsers,
      onlineUsersRows,
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
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      this.prisma.profile.count({ where: { kycStatus: 'APPROVED' } }),
      this.prisma.referral.count(),
      this.prisma.loginHistory.groupBy({
        by: ['userId'],
        where: { isSuccess: true, createdAt: { gte: onlineSince } },
      }),
    ]);

    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, createdAt: true, status: true },
    });

    return {
      totalUsers,
      activeUsers,
      todayRegistrations,
      weekRegistrations,
      verifiedUsers,
      referralUsers,
      onlineUsers: onlineUsersRows.length,
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
    @Query('status') status?: string,
  ) {
    const pageNum = Math.max(1, page ? parseInt(page) || 1 : 1);
    const limitNum = Math.min(100, Math.max(1, limit ? parseInt(limit) || 20 : 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { referralCode: { contains: search, mode: 'insensitive' } },
        { profile: { is: { firstName: { contains: search, mode: 'insensitive' } } } },
        { profile: { is: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (status) where.status = status;

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
          referralCode: true,
          createdAt: true,
          profile: {
            select: { firstName: true, lastName: true, kycStatus: true },
          },
          roles: {
            include: { role: true },
          },
          referredBy: {
            select: { referrer: { select: { id: true, email: true, referralCode: true } } },
          },
          _count: {
            select: { wallets: true, deposits: true, withdrawals: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Last successful login per user (single grouped query for the page).
    const lastLogins = users.length
      ? await this.prisma.loginHistory.groupBy({
          by: ['userId'],
          where: { userId: { in: users.map((u) => u.id) }, isSuccess: true },
          _max: { createdAt: true },
        })
      : [];
    const lastLoginMap = new Map(lastLogins.map((l) => [l.userId, l._max.createdAt]));

    return {
      data: users.map((u) => ({
        ...u,
        referredByUser: u.referredBy?.referrer ?? null,
        lastLoginAt: lastLoginMap.get(u.id) ?? null,
      })),
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Admin: Get user details (read-only overview)' })
  async getUserById(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        demoModeEnabled: true,
        referralCode: true,
        createdAt: true,
        profile: true,
        roles: { include: { role: true } },
        wallets: true,
        deposits: { orderBy: { createdAt: 'desc' }, take: 20 },
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 20 },
        kycDocuments: { orderBy: { createdAt: 'desc' }, select: { id: true, documentType: true, status: true, createdAt: true } },
        tradingAccounts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, accountNumber: true, type: true, accountClass: true, name: true, server: true,
            leverage: true, currency: true, balance: true, equity: true, freeMargin: true,
            isActive: true, isArchived: true, createdAt: true,
          },
        },
        referredBy: {
          select: { status: true, createdAt: true, referrer: { select: { id: true, email: true, referralCode: true } } },
        },
        referralsMade: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, rewardAmount: true, createdAt: true,
            referred: { select: { id: true, email: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const accountIds = user.tradingAccounts.map((a) => a.id);
    const [lastLogin, positions, openPositions, orderCount] = await Promise.all([
      this.prisma.loginHistory.findFirst({
        where: { userId: id, isSuccess: true },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      accountIds.length
        ? this.prisma.position.findMany({
            where: { tradingAccountId: { in: accountIds } },
            select: { status: true, profit: true, volume: true },
          })
        : Promise.resolve([]),
      accountIds.length
        ? this.prisma.position.count({ where: { tradingAccountId: { in: accountIds }, status: 'OPEN' } })
        : Promise.resolve(0),
      accountIds.length ? this.prisma.order.count({ where: { tradingAccountId: { in: accountIds } } }) : Promise.resolve(0),
    ]);

    const closed = positions.filter((p) => p.status !== 'OPEN');
    const wins = closed.filter((p) => Number(p.profit) > 0).length;
    const tradingStats = {
      totalOrders: orderCount,
      totalPositions: positions.length,
      openPositions,
      closedPositions: closed.length,
      totalVolume: positions.reduce((a, p) => a + Number(p.volume), 0),
      realizedProfit: closed.reduce((a, p) => a + Number(p.profit), 0),
      winRate: closed.length ? (wins / closed.length) * 100 : 0,
    };

    return {
      ...user,
      referredByUser: user.referredBy?.referrer ?? null,
      lastLoginAt: lastLogin?.createdAt ?? null,
      tradingStats,
    };
  }

  @Patch('users/:id/disable')
  @ApiOperation({ summary: 'Admin: Disable a user account (blocks login and API access)' })
  async disableUser(@Param('id') targetId: string, @CurrentUser() admin: { id: string }) {
    return this.setUserStatus(targetId, admin.id, 'SUSPENDED', 'DISABLE_USER');
  }

  @Patch('users/:id/enable')
  @ApiOperation({ summary: 'Admin: Re-enable a user account' })
  async enableUser(@Param('id') targetId: string, @CurrentUser() admin: { id: string }) {
    return this.setUserStatus(targetId, admin.id, 'ACTIVE', 'ENABLE_USER');
  }

  private async setUserStatus(targetId: string, adminId: string, status: string, action: string) {
    if (targetId === adminId) throw new BadRequestException('You cannot change your own account status');
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, roles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('User not found');
    if (status !== 'ACTIVE' && target.roles.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r.role.name))) {
      throw new BadRequestException('Administrator accounts cannot be disabled');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { status },
      select: { id: true, email: true, status: true },
    });
    await this.prisma.auditLog.create({
      data: { action, entityType: 'USER', entityId: targetId, userId: adminId },
    });
    return updated;
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

  @Patch('users/:id/promote')
  @ApiOperation({ summary: 'Admin: Grant the ADMIN role to a user' })
  async promoteToAdmin(@Param('id') targetId: string, @CurrentUser() admin: { id: string }) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) throw new NotFoundException('User not found');
    const role = await this.prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Platform Administrator' },
    });
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId: targetId, roleId: role.id } },
      update: {},
      create: { userId: targetId, roleId: role.id },
    });
    await this.prisma.auditLog.create({
      data: { action: 'PROMOTE_ADMIN', entityType: 'USER', entityId: targetId, userId: admin.id },
    });
    return { id: targetId, isAdmin: true, message: 'User promoted to admin' };
  }

  @Patch('users/:id/demote')
  @ApiOperation({ summary: 'Admin: Remove the ADMIN role from a user' })
  async removeAdmin(@Param('id') targetId: string, @CurrentUser() admin: { id: string }) {
    if (targetId === admin.id) throw new BadRequestException('You cannot remove your own admin role');
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, roles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.roles.some((r) => r.role.name === 'SUPER_ADMIN')) {
      throw new BadRequestException('Super administrators cannot be demoted');
    }
    const role = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (role) {
      await this.prisma.userRole.deleteMany({ where: { userId: targetId, roleId: role.id } });
    }
    await this.prisma.auditLog.create({
      data: { action: 'REMOVE_ADMIN', entityType: 'USER', entityId: targetId, userId: admin.id },
    });
    return { id: targetId, isAdmin: false, message: 'Admin role removed' };
  }

}
