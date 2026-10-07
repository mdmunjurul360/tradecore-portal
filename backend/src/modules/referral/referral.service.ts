import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { generateReferralCode, normalizeReferralCode, REFERRAL_PREFIX } from './referral-code.util';

@Injectable()
export class ReferralService implements OnModuleInit {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Backfills referral codes for existing users:
   *  - users without a code get a fresh `TC-XXXXXX` code
   *  - legacy (cuid) codes are upgraded to the new format ONLY when nobody has used them yet
   *    (no relationships are ever changed, so existing referral links keep working).
   */
  async onModuleInit() {
    try {
      const candidates = await this.prisma.user.findMany({
        where: {
          OR: [
            { referralCode: null },
            { NOT: { referralCode: { startsWith: REFERRAL_PREFIX } } },
          ],
        },
        select: { id: true, referralCode: true, _count: { select: { referralsMade: true } } },
      });

      let updated = 0;
      for (const u of candidates) {
        if (u.referralCode && u._count.referralsMade > 0) continue; // keep codes already in use
        await this.assignNewCode(u.id);
        updated++;
      }
      if (updated > 0) this.logger.log(`Backfilled referral codes for ${updated} user(s)`);
    } catch (err) {
      this.logger.warn(`Referral code backfill skipped: ${(err as Error).message}`);
    }
  }

  /** Generates a unique code that is not yet taken by any user. */
  async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateReferralCode();
      const exists = await this.prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
      if (!exists) return code;
    }
    return generateReferralCode(8);
  }

  private async assignNewCode(userId: string): Promise<string> {
    const code = await this.generateUniqueCode();
    await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }

  /** Returns the user's referral code, creating one if it is missing. */
  async ensureReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
    if (user?.referralCode) return user.referralCode;
    return this.assignNewCode(userId);
  }

  /** Public: checks whether a referral code exists (used by the register page). */
  async validateCode(rawCode: string) {
    const code = normalizeReferralCode(rawCode);
    if (!code) return { valid: false };
    const referrer = await this.prisma.user.findFirst({
      where: { referralCode: { equals: code, mode: 'insensitive' }, status: 'ACTIVE' },
      select: { email: true, profile: { select: { firstName: true } } },
    });
    if (!referrer) return { valid: false };
    return {
      valid: true,
      code,
      referrer: referrer.profile?.firstName || referrer.email.replace(/(.{2})(.*)(?=@)/, '$1***'),
    };
  }

  async getReferralStats(userId: string) {
    const referralCode = await this.ensureReferralCode(userId);

    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            _count: { select: { deposits: true, buyerTrades: true, sellerTrades: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // "Active" = referred account is enabled and has funded or traded at least once.
    const approvedDepositUsers = referrals.length
      ? await this.prisma.deposit.groupBy({
          by: ['userId'],
          where: { userId: { in: referrals.map((r) => r.referredId) }, status: 'APPROVED' },
        })
      : [];
    const funded = new Set(approvedDepositUsers.map((d) => d.userId));
    const isActive = (r: (typeof referrals)[number]) =>
      r.referred.status === 'ACTIVE' &&
      (funded.has(r.referredId) || r.referred._count.buyerTrades + r.referred._count.sellerTrades > 0);

    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(isActive).length;
    const totalRewards = referrals
      .filter((r) => r.status === 'REWARDED')
      .reduce((acc, r) => acc + Number(r.rewardAmount), 0);
    const pendingRewards = referrals
      .filter((r) => r.status !== 'REWARDED')
      .reduce((acc, r) => acc + Number(r.rewardAmount), 0);

    const history = referrals.map((r) => ({
      id: r.id,
      email: r.referred.email.replace(/(.{2})(.*)(?=@)/, '$1***'), // mask email
      status: r.status,
      active: isActive(r),
      rewardAmount: Number(r.rewardAmount),
      createdAt: r.createdAt,
    }));

    return {
      referralCode,
      stats: {
        totalReferrals,
        activeReferrals,
        totalRewards,
        pendingRewards,
      },
      history,
      earnings: history.filter((h) => h.rewardAmount > 0),
    };
  }
}
