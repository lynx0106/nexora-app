import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Query,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  @Get('conversations')
  async getConversations(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const user = req.user!;
    // Only admins/staff see conversations list
    if (user.role === 'user') return [];

    let effectiveTenantId = user.tenantId;
    if (user.role === 'superadmin' && tenantId) {
      effectiveTenantId = tenantId;
    }

    // For superadmin without tenant selection, return empty or message
    if (!effectiveTenantId) {
      return [];
    }

    const userIds = await this.chatService.getConversations(effectiveTenantId);
    if (!userIds.length) return [];

    // Fetch user details
    const users = await Promise.all(
      userIds.map((id) => this.usersService.findOne(id)),
    );
    return users.filter((u) => u !== null);
  }

  /**
   * Get all users in the tenant for internal chat
   * This allows admin/staff to see all team members
   */
  @Get('users')
  async getTenantUsers(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const user = req.user!;

    let effectiveTenantId = user.tenantId;
    if (user.role === 'superadmin' && tenantId) {
      effectiveTenantId = tenantId;
    }

    // For superadmin without tenant selection, return empty or message
    if (!effectiveTenantId) {
      return [];
    }

    // Return all active users in the tenant
    const users = await this.usersService.findByTenant(effectiveTenantId);
    return users.filter((u) => u.isActive !== false);
  }

  @Get('history')
  async getHistory(
    @Req() req: Request,
    @Query('limit') limit: number,
    @Query('scope') scope: string = 'INTERNAL',
    @Query('targetUserId') targetUserId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const user = req.user!;

    // Security Check:
    // If scope is INTERNAL, user must be admin or superadmin (or staff)
    // If scope is SUPPORT, user can be admin (talk to superadmin) or superadmin (talk to tenant)
    // If scope is CUSTOMER:
    //    - If user is 'user' (client), targetUserId must be themselves (or ignored and forced to themselves)
    //    - If user is 'admin', they can query any targetUserId

    let effectiveTargetUserId = targetUserId;

    if (scope === 'CUSTOMER' && user.role === 'user') {
      effectiveTargetUserId = user.userId;
    }

    // If Superadmin is viewing, allow tenantId override
    let effectiveTenantId = user.tenantId;
    if (user.role === 'superadmin' && tenantId) {
      effectiveTenantId = tenantId;
    }

    // For superadmin without tenant selection, return empty
    if (!effectiveTenantId) {
      return [];
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
    @Req() req: Request,
    @Query('scope') scope: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const user = req.user!;

    // For superadmin, allow tenantId override
    let effectiveTenantId = user.tenantId;
    if (user.role === 'superadmin' && tenantId) {
      effectiveTenantId = tenantId;
    }

    // For superadmin without tenant selection, return error
    if (!effectiveTenantId) {
      return { success: false, message: 'No tenant selected' };
    }

    await this.chatService.markAsRead(
      effectiveTenantId,
      scope,
      user.userId,
      targetUserId,
    );
    return { success: true };
  }

  @Get('unread')
  async getUnread(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const user = req.user!;

    // For superadmin, allow tenantId override
    let effectiveTenantId = user.tenantId;
    if (user.role === 'superadmin' && tenantId) {
      effectiveTenantId = tenantId;
    }

    // For superadmin without tenant selection, return 0
    if (!effectiveTenantId) {
      return { count: 0 };
    }

    const count = await this.chatService.getUnreadCount(
      effectiveTenantId,
      user.userId,
      user.role ?? 'user',
    );
    return { count };
  }

  @Post('message')
  async sendMessage(@Req() req: Request, @Body() body: SendMessageDto) {
    const user = req.user!;

    // For superadmin, allow tenantId override
    const effectiveTenantId = body.tenantId || user.tenantId;

    // If superadmin without tenant selection, return error
    if (!effectiveTenantId) {
      return { success: false, message: 'No tenant selected' };
    }

    const message = await this.chatService.createMessage(
      body.content,
      user.userId,
      effectiveTenantId,
      body.scope || 'INTERNAL',
      body.targetUserId,
      false, // isAi
      body.mediaUrl,
      body.type || 'text',
    );
    return message;
  }
}
