import { IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'PASSPORT', description: 'Document type: PASSPORT, ID_CARD, UTILITY_BILL' })
  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @ApiProperty({ example: 'uuid-file-metadata-id', description: 'File reference ID from POST /upload/kyc' })
  @IsString()
  @IsNotEmpty()
  documentReference!: string;
}
