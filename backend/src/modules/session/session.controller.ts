import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { SessionService } from './session.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  async getSessions(@CurrentUser() user: User) {
    const data = await this.sessionService.getSessions(user.id);
    return { success: true, data };
  }

  @Delete(':id')
  async revokeSession(@CurrentUser() user: User, @Param('id') sessionId: string) {
    const data = await this.sessionService.revokeSession(user.id, sessionId);
    return { success: true, data };
  }
}
