import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminReviewDepositDto {
  @ApiPropertyOptional({ example: 'Verified by bank statement' })
  @IsOptional()
  @IsString()
  reason?: string;
}
