import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AdminGetKycFilterDto } from './dto/admin-get-kyc-filter.dto';
import { AdminReviewKycDto } from './dto/admin-review-kyc.dto';

@Injectable()
export class AdminKycService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filterDto: AdminGetKycFilterDto) {
    const { status, userId, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
    };

    const [documents, total] = await Promise.all([
      this.prisma.kycDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.kycDocument.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`KYC document with ID ${id} not found`);
    }

    return document;
  }

  async approve(id: string, reviewDto: AdminReviewKycDto) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`KYC document with ID ${id} not found`);
    }

    if (document.status !== 'PENDING') {
      throw new BadRequestException(
        `KYC document is already ${document.status}. Only PENDING documents can be approved.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDoc = await tx.kycDocument.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // Update user profile kycStatus
      await tx.profile.update({
        where: { userId: document.userId },
        data: { kycStatus: 'APPROVED' },
      });

      return updatedDoc;
    });
  }

  async reject(id: string, reviewDto: AdminReviewKycDto) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`KYC document with ID ${id} not found`);
    }

    if (document.status !== 'PENDING') {
      throw new BadRequestException(
        `KYC document is already ${document.status}. Only PENDING documents can be rejected.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDoc = await tx.kycDocument.update({
        where: { id },
        data: { 
          status: 'REJECTED',
          rejectionReason: reviewDto.reason,
        },
      });

      // Update user profile kycStatus
      await tx.profile.update({
        where: { userId: document.userId },
        data: { kycStatus: 'REJECTED' },
      });

      return updatedDoc;
    });
  }
}
