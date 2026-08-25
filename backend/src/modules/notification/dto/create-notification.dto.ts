import { IsString, IsEnum, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export class CreateNotificationDto {
  @ApiProperty({ example: 'IN_APP', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Welcome to TradeCore' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your account has been successfully created.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: { actionUrl: '/dashboard' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
