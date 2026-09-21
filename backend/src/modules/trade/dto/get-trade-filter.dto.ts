import { IsOptional, IsString, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum TradeSideFilter {
  BUY = 'BUY',
  SELL = 'SELL',
}

export class GetTradeFilterDto {
  @IsOptional()
  @IsString()
  tradingPairId?: string;

  @IsOptional()
  @IsEnum(TradeSideFilter)
  side?: TradeSideFilter;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
