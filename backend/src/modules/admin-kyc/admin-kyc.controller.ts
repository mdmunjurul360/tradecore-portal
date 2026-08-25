import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminKycService } from './admin-kyc.service';
import { AdminGetKycFilterDto } from './dto/admin-get-kyc-filter.dto';
import { AdminReviewKycDto } from './dto/admin-review-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/kyc')
export class AdminKycController {
  constructor(private readonly adminKycService: AdminKycService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all KYC document requests' })
  async findAll(@Query() filterDto: AdminGetKycFilterDto) {
    return this.adminKycService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get a specific KYC document by ID' })
  async findOne(@Param('id') id: string) {
    return this.adminKycService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Admin: Approve a pending KYC document' })
  async approve(
    @Param('id') id: string,
    @Body() reviewDto: AdminReviewKycDto,
  ) {
    return this.adminKycService.approve(id, reviewDto);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Admin: Reject a pending KYC document' })
  async reject(
    @Param('id') id: string,
    @Body() reviewDto: AdminReviewKycDto,
  ) {
    return this.adminKycService.reject(id, reviewDto);
  }
}
