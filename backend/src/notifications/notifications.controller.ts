import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  async getUnread(@Request() req: ExpressRequest) {
    const user = req.user;
    if (!user?.tenantId || !user?.userId) {
      return [];
    }
    return this.notificationsService.findAllUnread(user.tenantId, user.userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: ExpressRequest) {
    const user = req.user;
    if (!user?.tenantId || !user?.userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.notificationsService.markAllAsRead(user.tenantId, user.userId);
  }
}
