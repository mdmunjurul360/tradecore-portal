import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminDepositService } from './admin-deposit.service';
import { AdminGetDepositsFilterDto } from './dto/admin-get-deposits-filter.dto';
import { AdminReviewDepositDto } from './dto/admin-review-deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Deposits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/deposits')
export class AdminDepositController {
  constructor(private readonly adminDepositService: AdminDepositService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all deposit requests' })
  async findAll(@Query() filterDto: AdminGetDepositsFilterDto) {
    return this.adminDepositService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get a specific deposit by ID' })
  async findOne(@Param('id') id: string) {
    return this.adminDepositService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Admin: Approve a pending deposit' })
  async approve(
    @Param('id') id: string,
    @Body() reviewDto: AdminReviewDepositDto,
  ) {
    return this.adminDepositService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Admin: Reject a pending deposit' })
  async reject(
    @Param('id') id: string,
    @Body() reviewDto: AdminReviewDepositDto,
  ) {
    return this.adminDepositService.reject(id);
  }
}
