import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateApiKeyDto) {
    const key = crypto.randomBytes(16).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        key,
        secret,
      },
    });

    return {
      message: 'API Key created successfully. Save the secret key, it will not be shown again.',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        secret: apiKey.secret,
        createdAt: apiKey.createdAt,
      },
    };
  }

  async findAll(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });

    return { message: 'API Key deleted successfully' };
  }
}
