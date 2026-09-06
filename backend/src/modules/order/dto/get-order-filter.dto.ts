import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformOrderStatus, OrderType, OrderSide } from '@prisma/client';

export class GetOrderFilterDto {
  @ApiPropertyOptional({ enum: PlatformOrderStatus, description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(PlatformOrderStatus)
  status?: PlatformOrderStatus;

  @ApiPropertyOptional({ enum: OrderSide, description: 'Filter by order side' })
  @IsOptional()
  @IsEnum(OrderSide)
  side?: OrderSide;

  @ApiPropertyOptional({ enum: OrderType, description: 'Filter by order type' })
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @ApiPropertyOptional({ description: 'Filter by trading pair ID' })
  @IsOptional()
  @IsString()
  tradingPairId?: string;

  @ApiPropertyOptional({ description: 'Search by trading pair symbol' })
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
