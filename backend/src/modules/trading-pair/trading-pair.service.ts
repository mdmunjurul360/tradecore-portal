import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateTradingPairDto } from './dto/create-trading-pair.dto';
import { UpdateTradingPairDto } from './dto/update-trading-pair.dto';
import { UpdateTradingPairStatusDto } from './dto/update-trading-pair-status.dto';
import { GetTradingPairFilterDto } from './dto/get-trading-pair-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TradingPairService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTradingPairDto) {
    // Validate symbol uniqueness
    const existing = await this.prisma.tradingPair.findUnique({
      where: { symbol: dto.symbol.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(
        `Trading pair with symbol ${dto.symbol.toUpperCase()} already exists`,
      );
    }

    return this.prisma.tradingPair.create({
      data: {
        symbol: dto.symbol.toUpperCase(),
        baseAsset: dto.baseAsset.toUpperCase(),
        quoteAsset: dto.quoteAsset.toUpperCase(),
        ...(dto.minOrderSize !== undefined && { minOrderSize: dto.minOrderSize }),
        ...(dto.maxOrderSize !== undefined && { maxOrderSize: dto.maxOrderSize }),
        ...(dto.tickSize !== undefined && { tickSize: dto.tickSize }),
        ...(dto.lotSize !== undefined && { lotSize: dto.lotSize }),
      },
    });
  }

  async findAll(filterDto: GetTradingPairFilterDto) {
    const { status, isActive, search, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    const where: Prisma.TradingPairWhereInput = {
      ...(status && { status }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { symbol: { contains: search.toUpperCase(), mode: 'insensitive' as const } },
          { baseAsset: { contains: search.toUpperCase(), mode: 'insensitive' as const } },
          { quoteAsset: { contains: search.toUpperCase(), mode: 'insensitive' as const } },
        ],
      }),
    };

    const [tradingPairs, total] = await Promise.all([
      this.prisma.tradingPair.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tradingPair.count({ where }),
    ]);

    return {
      data: tradingPairs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tradingPair = await this.prisma.tradingPair.findUnique({
      where: { id },
    });

    if (!tradingPair) {
      throw new NotFoundException(`Trading pair with ID ${id} not found`);
    }

    return tradingPair;
  }

  async update(id: string, dto: UpdateTradingPairDto) {
    await this.findOne(id);

    return this.prisma.tradingPair.update({
      where: { id },
      data: {
        ...(dto.baseAsset && { baseAsset: dto.baseAsset.toUpperCase() }),
        ...(dto.quoteAsset && { quoteAsset: dto.quoteAsset.toUpperCase() }),
        ...(dto.minOrderSize !== undefined && { minOrderSize: dto.minOrderSize }),
        ...(dto.maxOrderSize !== undefined && { maxOrderSize: dto.maxOrderSize }),
        ...(dto.tickSize !== undefined && { tickSize: dto.tickSize }),
        ...(dto.lotSize !== undefined && { lotSize: dto.lotSize }),
      },
    });
  }

  async updateStatus(id: string, dto: UpdateTradingPairStatusDto) {
    await this.findOne(id);

    return this.prisma.tradingPair.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete: mark as inactive and suspended
    return this.prisma.tradingPair.update({
      where: { id },
      data: {
        isActive: false,
        status: 'SUSPENDED',
      },
    });
  }
}
