import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { GetPortfolioFilterDto } from './dto/get-portfolio-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user holdings' })
  async findAll(@CurrentUser() user: User, @Query() filterDto: GetPortfolioFilterDto) {
    return this.portfolioService.findAll(user.id, filterDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get portfolio summary and statistics' })
  async getSummary(@CurrentUser() user: User) {
    return this.portfolioService.getSummary(user.id);
  }

  @Get(':asset')
  @ApiOperation({ summary: 'Get holding by specific asset (e.g., BTC)' })
  async findByAsset(@CurrentUser() user: User, @Param('asset') asset: string) {
    return this.portfolioService.findByAsset(user.id, asset);
  }
}
