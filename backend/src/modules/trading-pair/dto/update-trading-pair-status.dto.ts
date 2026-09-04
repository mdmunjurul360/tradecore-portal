import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TradingPairStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateTradingPairStatusDto {
  @ApiPropertyOptional({ enum: TradingPairStatus, description: 'Trading pair status' })
  @IsOptional()
  @IsEnum(TradingPairStatus)
  status?: TradingPairStatus;

  @ApiPropertyOptional({ description: 'Whether the trading pair is active' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
