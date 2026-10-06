import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  async getReferralStats(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            email: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalReferrals = referrals.length;
    const totalRewards = referrals.reduce((acc, curr) => acc + Number(curr.rewardAmount), 0);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    return {
      referralCode: user?.referralCode || userId,
      stats: {
        totalReferrals,
        totalRewards,
      },
      history: referrals.map(r => ({
        id: r.id,
        email: r.referred.email.replace(/(.{2})(.*)(?=@)/, '$1***'), // mask email
        status: r.status,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt,
      }))
    };
  }
}
