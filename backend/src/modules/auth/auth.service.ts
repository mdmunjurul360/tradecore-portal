import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../core/prisma/prisma.service';
import { generateReferralCode, normalizeReferralCode } from '../referral/referral-code.util';

// Account states that must not be able to authenticate.
const BLOCKED_STATUSES = ['SUSPENDED', 'DISABLED', 'BANNED'];

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    let referredBy: string | undefined;

    // Validate the referral code (case-insensitive). An unknown code never blocks registration.
    const suppliedCode = normalizeReferralCode(registerDto.referralCode);
    if (suppliedCode) {
      const referrer = await this.prisma.user.findFirst({
        where: { referralCode: { equals: suppliedCode, mode: 'insensitive' } },
      });
      // Prevent self referral (same account / same email).
      if (referrer && referrer.email.toLowerCase() !== registerDto.email.toLowerCase()) {
        referredBy = referrer.id;
      }
    }

    // Every new user automatically receives a unique referral code.
    let ownReferralCode = generateReferralCode();
    for (let i = 0; i < 10; i++) {
      const taken = await this.prisma.user.findUnique({ where: { referralCode: ownReferralCode } });
      if (!taken) break;
      ownReferralCode = generateReferralCode();
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
          referralCode: ownReferralCode,
        }
      });

      // referredId is unique, so a user can only ever be linked to one referrer (no duplicates).
      if (referredBy && referredBy !== newUser.id) {
        await tx.referral.create({
          data: {
            referrerId: referredBy,
            referredId: newUser.id,
            status: 'PENDING',
            rewardAmount: 0,
          }
        });
      }

      // Auto-provision 10,000 USD Demo Wallet
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          currency: 'USD',
          type: 'DEMO',
          balance: 10000.0000,
        }
      });

      return newUser;
    });

    const tokens = this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        roles: [],
        demoModeEnabled: user.demoModeEnabled,
      },
      ...tokens
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (BLOCKED_STATUSES.includes(user.status)) {
      throw new UnauthorizedException('Your account has been disabled. Please contact support.');
    }

    if (user.twoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return {
          requiresTwoFactor: true,
          userId: user.id,
          message: 'Two-factor authentication code required',
        };
      }

      const is2FaValid = await this.verifyTwoFactorAuthentication(user.id, loginDto.twoFactorCode);
      if (!is2FaValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Ensure Demo Wallet exists for old users
    const demoWallet = await this.prisma.wallet.findFirst({
      where: { userId: user.id, type: 'DEMO', currency: 'USD' }
    });
    
    if (!demoWallet) {
      await this.prisma.wallet.create({
        data: {
          userId: user.id,
          currency: 'USD',
          type: 'DEMO',
          balance: 10000.0000,
        }
      });
    }

    // Record the login for admin monitoring (best effort - never blocks authentication).
    this.prisma.loginHistory
      .create({ data: { userId: user.id, isSuccess: true } })
      .catch(() => undefined);

    const tokens = this.generateTokens(user.id, user.email);
    const rolesArr = user.roles?.map(r => r.role?.name) || [];
    if (process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL && !rolesArr.includes('SUPER_ADMIN')) {
      rolesArr.push('SUPER_ADMIN');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        roles: rolesArr,
        twoFactorEnabled: user.twoFactorEnabled,
        demoModeEnabled: user.demoModeEnabled,
      },
      ...tokens
    };
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findByEmail(payload.email);
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTwoFactorAuthenticationSecret(user: any) {
    const { authenticator } = require('otplib');
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'TradeCore', secret);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    const qrcode = require('qrcode');
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    
    return {
      secret,
      qrCodeDataUrl,
    };
  }

  async verifyTwoFactorAuthentication(userId: string, code: string) {
    const { authenticator } = require('otplib');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return false;
    }
    return authenticator.verify({ token: code, secret: user.twoFactorSecret });
  }

  async enableTwoFactorAuthentication(userId: string, code: string) {
    const isCodeValid = await this.verifyTwoFactorAuthentication(userId, code);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return { success: true };
  }

  async disableTwoFactorAuthentication(userId: string, code: string) {
    const isCodeValid = await this.verifyTwoFactorAuthentication(userId, code);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { success: true };
  }
}
