import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: 'Generated file reference ID (use this for KYC submission)' })
  fileId: string;

  @ApiProperty({ description: 'Original file name' })
  originalName: string;

  @ApiProperty({ description: 'Generated secure file name' })
  filename: string;

  @ApiProperty({ description: 'File path or URL' })
  path: string;

  @ApiProperty({ description: 'MIME type of the file' })
  mimeType: string;

  @ApiProperty({ description: 'Size of the file in bytes' })
  size: number;
}
