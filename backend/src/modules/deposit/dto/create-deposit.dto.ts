import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepositDto {
  @ApiProperty({ example: 1000.50 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ example: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiPropertyOptional({ example: 'TXN-987654321' })
  @IsString()
  @IsOptional()
  reference?: string;
}
