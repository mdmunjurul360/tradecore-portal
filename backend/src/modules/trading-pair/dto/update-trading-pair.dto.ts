import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateTradingPairDto {
  @ApiPropertyOptional({ example: 'EUR', description: 'Base asset of the pair' })
  @IsOptional()
  @IsString()
  baseAsset?: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Quote asset of the pair' })
  @IsOptional()
  @IsString()
  quoteAsset?: string;

  @ApiPropertyOptional({ example: 0.01, description: 'Minimum order size in lots' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderSize?: number;

  @ApiPropertyOptional({ example: 100.0, description: 'Maximum order size in lots' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxOrderSize?: number;

  @ApiPropertyOptional({ example: 0.00001, description: 'Minimum price increment' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tickSize?: number;

  @ApiPropertyOptional({ example: 1.0, description: 'Standard lot size' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lotSize?: number;
}
