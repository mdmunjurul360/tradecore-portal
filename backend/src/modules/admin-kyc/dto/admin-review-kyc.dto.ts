import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminReviewKycDto {
  @ApiPropertyOptional({ example: 'Document is blurry or invalid' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Internal notes about user verification' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
