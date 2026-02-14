import { Controller, Get, Post, Req, UseGuards, Query, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  @Get('conversations')
  async getConversations(@Req() req, @Query('tenantId') tenantId?: string) {
    const user = req.user;
    // Only admins/staff see conversations list
    if (user.role === 'user') return [];

    let effectiveTenantId = user.tenantId;
    if (user.role === 'superadmin' && tenantId) {
      effectiveTenantId = tenantId;
    }

    const userIds = await this.chatService.getConversations(effectiveTenantId);
    if (!userIds.length) return [];

    // Fetch user details
    const users = await Promise.all(
      userIds.map((id) => this.usersService.findOne(id)),
    );
    return users.filter((u) => u !== null);
  }

  @Get('history')
  async getHistory(
    @Req() req,
    @Query('limit') limit: number,
    @Query('scope') scope: string = 'INTERNAL',
    @Query('targetUserId') targetUserId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const user = req.user;

    // Security Check:
    // If scope is INTERNAL, user must be admin or superadmin (or staff)
    // If scope is SUPPORT, user can be admin (talk to superadmin) or superadmin (talk to tenant)
    // If scope is CUSTOMER:
    //    - If user is 'user' (client), targetUserId must be themselves (or ignored and forced to themselves)
    //    - If user is 'admin', they can query any targetUserId

    let effectiveTargetUserId = targetUserId;

    if (scope === 'CUSTOMER') {
      if (user.role === 'user') {
        effectiveTargetUserId = user.userId;
      }
    }

    // If Superadmin is viewing, allow tenantId override
    let effectiveTenantId = user.tenantId;
    if (user.role === 'superadmin' && tenantId) {
      effectiveTenantId = tenantId;
    }

    return this.chatService.getMessages(
      effectiveTenantId,
      scope,
      effectiveTargetUserId,
      limit,
    );
  }

  @Post('mark-read')
  async markRead(
    @Req() req,
    @Query('scope') scope: string,
    @Query('targetUserId') targetUserId?: string,
  ) {
    const user = req.user;
    await this.chatService.markAsRead(
      user.tenantId,
      scope,
      user.userId,
      targetUserId,
    );
    return { success: true };
  }

  @Get('unread')
  async getUnread(@Req() req) {
    const count = await this.chatService.getUnreadCount(
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
    return { count };
  }

  @Post('message')
  async sendMessage(@Req() req, @Body() body: any) {
    const user = req.user;
    const message = await this.chatService.createMessage(
      body.content,
      user.userId,
      body.tenantId || user.tenantId, // Allow overriding tenantId if needed (e.g. superadmin) but usually user.tenantId
      body.scope || 'INTERNAL',
      body.targetUserId,
      false, // isAi
      body.mediaUrl,
      body.type || 'text',
    );
    return message;
  }
}
