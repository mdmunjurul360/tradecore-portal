import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user notifications' })
  async getAllNotifications(@CurrentUser() user: User) {
    return this.notificationService.getUserNotifications(user.id, false);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread user notifications' })
  async getUnreadNotifications(@CurrentUser() user: User) {
    return this.notificationService.getUserNotifications(user.id, true);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationService.markAllAsRead(user.id);
    return { message: 'All notifications marked as read' };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  async markAsRead(@CurrentUser() user: User, @Param('id') notificationId: string) {
    await this.notificationService.markAsRead(user.id, notificationId);
    return { message: 'Notification marked as read' };
  }
}
