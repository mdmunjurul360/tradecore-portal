import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async submitKyc(userId: string, submitKycDto: SubmitKycDto) {
    const { nationalId, dateOfBirth, country, address, documentType, documentReference } = submitKycDto;

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile && (existingProfile.kycStatus === 'PENDING' || existingProfile.kycStatus === 'APPROVED')) {
      throw new ConflictException(`KYC submission is already ${existingProfile.kycStatus}`);
    }

    await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        nationalId,
        dateOfBirth: new Date(dateOfBirth),
        country,
        address,
        kycStatus: 'PENDING',
      },
      update: {
        nationalId,
        dateOfBirth: new Date(dateOfBirth),
        country,
        address,
        kycStatus: 'PENDING',
      },
    });

    const fileId = documentReference || `placeholder_${Date.now()}`;

    const kycDocument = await this.prisma.kycDocument.create({
      data: {
        userId,
        documentType,
        fileId,
        status: 'PENDING',
      },
    });

    return {
      message: 'KYC submitted successfully',
      kycStatus: 'PENDING',
      documentId: kycDocument.id,
    };
  }

  async getStatus(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { kycStatus: true, nationalId: true },
    });
    
    const documents = await this.prisma.kycDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    return {
      kycStatus: profile?.kycStatus || 'NOT_SUBMITTED',
      nationalId: profile?.nationalId || null,
      latestDocument: documents[0] || null,
    };
  }
}
