import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 500.00 })
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
  withdrawalMethod!: string;

  @ApiProperty({ example: 'IBAN: DE89370400440532013000' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiPropertyOptional({ example: 'Monthly salary withdrawal' })
  @IsString()
  @IsOptional()
  note?: string;
}
