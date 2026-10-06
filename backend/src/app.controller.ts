import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API root – confirms server is running' })
  getRoot() {
    return {
      success: true,
      name: 'TradeCore Portal API',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/docs',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }
}
