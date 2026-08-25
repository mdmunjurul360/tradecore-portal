import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async submitKyc(userId: string, submitKycDto: SubmitKycDto) {
    const { nationalId, dateOfBirth, country, address, documentType, documentReference } = submitKycDto;

    // Validate the file reference exists in the database
    const fileMetadata = await this.prisma.fileMetadata.findUnique({
      where: { id: documentReference },
    });

    if (!fileMetadata) {
      throw new BadRequestException(
        'Invalid document reference. Please upload a document first using POST /upload/kyc.',
      );
    }

    // Check for existing KYC submission
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile && (existingProfile.kycStatus === 'PENDING' || existingProfile.kycStatus === 'APPROVED')) {
      throw new ConflictException(`KYC submission is already ${existingProfile.kycStatus}`);
    }

    // Use a transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.profile.upsert({
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

      const kycDocument = await tx.kycDocument.create({
        data: {
          userId,
          documentType,
          fileId: documentReference,
          status: 'PENDING',
        },
      });

      return kycDocument;
    });

    return {
      message: 'KYC submitted successfully',
      kycStatus: 'PENDING',
      documentId: result.id,
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
