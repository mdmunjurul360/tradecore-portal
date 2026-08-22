import { IsString, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitKycDto {
  @ApiProperty({ example: 'ID123456789' })
  @IsString()
  @IsNotEmpty()
  nationalId!: string;

  @ApiProperty({ example: '1990-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth!: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: '123 Main St, New York, NY 10001' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'PASSPORT' })
  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @ApiPropertyOptional({ example: 'file_metadata_id_123' })
  @IsString()
  @IsOptional()
  documentReference?: string;
}
