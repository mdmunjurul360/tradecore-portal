import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminReviewWithdrawalDto {
  @ApiPropertyOptional({ example: 'Verified withdrawal request' })
  @IsOptional()
  @IsString()
  reason?: string;
}
