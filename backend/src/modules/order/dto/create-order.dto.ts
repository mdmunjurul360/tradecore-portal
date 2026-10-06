import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { OrderType, OrderSide } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ description: 'Trading pair symbol (e.g. BTC_USDT)' })
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ enum: OrderSide, example: 'BUY' })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({ enum: OrderType, example: 'MARKET' })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ example: 1.0, description: 'Order amount in base asset' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  amount: number;

  @ApiPropertyOptional({ example: 1.12345, description: 'Limit price (required for LIMIT orders)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 1.10000, description: 'Stop Loss price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stopLoss?: number;

  @ApiPropertyOptional({ example: 1.20000, description: 'Take Profit price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  takeProfit?: number;

  @ApiPropertyOptional({ example: true, description: 'Is CFD order' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isCfd?: boolean;
}
