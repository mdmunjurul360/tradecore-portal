import { IsOptional, IsEnum, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TradingPairStatus } from '@prisma/client';

export class GetTradingPairFilterDto {
  @ApiPropertyOptional({ enum: TradingPairStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(TradingPairStatus)
  status?: TradingPairStatus;

  @ApiPropertyOptional({ description: 'Filter by active state' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by symbol, base asset, or quote asset' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
