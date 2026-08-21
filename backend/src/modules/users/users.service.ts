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

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (user) {
      delete (user as any).passwordHash;
    }
    return user;
  }

  async updateProfile(userId: string, data: import('./dto/update-profile.dto').UpdateProfileDto) {
    const { phone, firstName, lastName, dateOfBirth } = data;

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

    if (firstName !== undefined || lastName !== undefined || dateOfBirth !== undefined) {
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

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
}
