import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReferralService } from './referral.service';
import { User } from '@prisma/client';

@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@CurrentUser() user: User) {
    return {
      success: true,
      data: await this.referralService.getReferralStats(user.id),
    };
  }

  /** Public so the register page can validate `?ref=CODE` before the user has an account. */
  @Get('validate/:code')
  async validate(@Param('code') code: string) {
    return {
      success: true,
      data: await this.referralService.validateCode(code),
    };
  }
}
