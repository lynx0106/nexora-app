import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  async getUnread(@Request() req) {
    const { tenantId, sub: userId } = req.user;
    return this.notificationsService.findAllUnread(tenantId, userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req) {
    const { tenantId, sub: userId } = req.user;
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }
}
