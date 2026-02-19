import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PushService } from './push.service';

@Controller('push')
@UseGuards(AuthGuard('jwt'))
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  async registerToken(
    @Body() body: { token: string; platform: 'ios' | 'android' | 'web' },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    await this.pushService.registerToken(userId, body.token, body.platform);
    return { success: true, message: 'Push token registered' };
  }

  @Post('unregister')
  async unregisterToken(@Body() body: { token: string }) {
    await this.pushService.unregisterToken(body.token);
    return { success: true, message: 'Push token unregistered' };
  }

  @Get('tokens/:userId')
  async getUserTokens(@Param('userId') userId: string) {
    const tokens = this.pushService.getTokensForUser(userId);
    return { count: tokens.length };
  }

  @Post('test')
  async sendTestNotification(@Req() req: any) {
    const userId = req.user.id;
    const sent = await this.pushService.sendToUser(
      userId,
      'Notificación de Prueba',
      'Si ves esto, las notificaciones push funcionan correctamente!',
      { type: 'test' },
    );
    return { success: sent, message: sent ? 'Notification sent' : 'No tokens registered' };
  }
}
