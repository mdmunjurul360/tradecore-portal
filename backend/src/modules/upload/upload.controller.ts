import { 
  Controller, 
  Post, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { kycFileFilter, MAX_FILE_SIZE } from './utils/file-validation.util';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

// Ensure the local upload directory exists
const uploadDir = 'uploads/kyc';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('kyc')
  @ApiOperation({ summary: 'Upload a KYC document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = randomUUID();
          const ext = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
      fileFilter: kycFileFilter,
    }),
  )
  async uploadKycDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('A valid document file is required.');
    }
    return this.uploadService.handleKycUpload(file);
  }
}
