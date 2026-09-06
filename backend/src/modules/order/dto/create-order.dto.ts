import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderType, OrderSide } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ description: 'Trading pair ID' })
  @IsNotEmpty()
  tradingPairId: string;

  @ApiProperty({ enum: OrderSide, example: 'BUY' })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({ enum: OrderType, example: 'MARKET' })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ example: 1.0, description: 'Order quantity in lots' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ example: 1.12345, description: 'Limit price (required for LIMIT orders)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
}
