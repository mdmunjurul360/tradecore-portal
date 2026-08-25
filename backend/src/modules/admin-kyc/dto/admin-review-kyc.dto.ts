import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminReviewKycDto {
  @ApiPropertyOptional({ example: 'Document is blurry or invalid' })
  @IsOptional()
  @IsString()
  reason?: string;
}
