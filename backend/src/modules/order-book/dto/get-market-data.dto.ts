import { IsOptional, IsString } from 'class-validator';

export class GetMarketDataDto {
  @IsOptional()
  @IsString()
  tradingPairId?: string;

  @IsOptional()
  @IsString()
  symbol?: string;
}
