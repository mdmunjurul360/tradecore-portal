import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminUploadService {
  constructor(private readonly prisma: PrismaService) {}

  async getFileMetadata(fileId: string) {
    const fileMetadata = await this.prisma.fileMetadata.findUnique({
      where: { id: fileId },
    });

    if (!fileMetadata) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    return fileMetadata;
  }

  async resolveSecureFilePath(fileId: string): Promise<{ absolutePath: string; mimeType: string; originalName: string }> {
    const fileMetadata = await this.getFileMetadata(fileId);

    // Resolve and normalize the file path
    const resolvedPath = path.resolve(fileMetadata.path);

    // Security: Prevent directory traversal
    const allowedBaseDir = path.resolve('uploads');
    if (!resolvedPath.startsWith(allowedBaseDir)) {
      throw new NotFoundException('File not found');
    }

    // Verify the file physically exists on disk
    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException('File is referenced but no longer exists on disk');
    }

    return {
      absolutePath: resolvedPath,
      mimeType: fileMetadata.mimeType,
      originalName: fileMetadata.originalName,
    };
  }
}
