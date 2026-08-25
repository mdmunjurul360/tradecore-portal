import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UploadResponseDto } from './dto/upload-response.dto';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processes the uploaded file, persists a FileMetadata record in the database,
   * and returns the metadata including the generated fileId.
   *
   * This is designed as an abstraction layer so that we can easily swap out
   * local disk storage for AWS S3, Google Cloud Storage, or Azure Blob Storage
   * without affecting the controllers.
   */
  async handleKycUpload(file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new InternalServerErrorException('File was not uploaded properly');
    }

    const fileMetadata = await this.prisma.fileMetadata.create({
      data: {
        bucket: 'local',
        path: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return {
      fileId: fileMetadata.id,
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
