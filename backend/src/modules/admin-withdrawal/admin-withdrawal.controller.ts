import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminWithdrawalService } from './admin-withdrawal.service';
import { AdminGetWithdrawalsFilterDto } from './dto/admin-get-withdrawals-filter.dto';
import { AdminReviewWithdrawalDto } from './dto/admin-review-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/withdrawals')
export class AdminWithdrawalController {
  constructor(private readonly adminWithdrawalService: AdminWithdrawalService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all withdrawal requests' })
  async findAll(@Query() filterDto: AdminGetWithdrawalsFilterDto) {
    return this.adminWithdrawalService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get a specific withdrawal by ID' })
  async findOne(@Param('id') id: string) {
    return this.adminWithdrawalService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Admin: Approve a pending withdrawal' })
  async approve(
    @Param('id') id: string,
    @Body() reviewDto: AdminReviewWithdrawalDto,
  ) {
    return this.adminWithdrawalService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Admin: Reject a pending withdrawal' })
  async reject(
    @Param('id') id: string,
    @Body() reviewDto: AdminReviewWithdrawalDto,
  ) {
    return this.adminWithdrawalService.reject(id);
  }
}
