import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminUploadService } from './admin-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/uploads')
export class AdminUploadController {
  constructor(private readonly adminUploadService: AdminUploadService) {}

  @Get(':fileId/metadata')
  @ApiOperation({ summary: 'Admin: Get file metadata by ID' })
  async getMetadata(@Param('fileId') fileId: string) {
    return this.adminUploadService.getFileMetadata(fileId);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Admin: Securely stream/serve a file by ID' })
  @ApiProduces('application/octet-stream')
  async serveFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const { absolutePath, mimeType, originalName } = 
      await this.adminUploadService.resolveSecureFilePath(fileId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    res.sendFile(absolutePath);
  }
}
