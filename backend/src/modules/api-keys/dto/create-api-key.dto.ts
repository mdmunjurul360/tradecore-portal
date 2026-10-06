import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Name of the API key' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
