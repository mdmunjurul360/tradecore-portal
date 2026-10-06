import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API Key' })
  create(@CurrentUser() user: User, @Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeysService.create(user.id, createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API Keys for current user' })
  findAll(@CurrentUser() user: User) {
    return this.apiKeysService.findAll(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API Key' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apiKeysService.remove(user.id, id);
  }
}
