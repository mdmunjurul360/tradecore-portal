import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReferralService } from './referral.service';
import { User } from '@prisma/client';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    return {
      success: true,
      data: await this.referralService.getReferralStats(user.id),
    };
  }
}
