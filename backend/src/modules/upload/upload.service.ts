import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UploadResponseDto } from './dto/upload-response.dto';

@Injectable()
export class UploadService {
  /**
   * Processes the uploaded file and returns metadata.
   * This is designed as an abstraction layer so that we can easily swap out
   * local disk storage for AWS S3, Google Cloud Storage, or Azure Blob Storage
   * without affecting the controllers.
   */
  async handleKycUpload(file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new InternalServerErrorException('File was not uploaded properly');
    }

    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
