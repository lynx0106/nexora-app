import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { getCorsOrigins, getJwtSecret } from '../config/runtime.config';

import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private aiService: AiService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Try to get token from multiple sources
      let token: string | undefined;

      // 1. Try handshake.auth (for backward compatibility)
      if (client.handshake.auth.token) {
        token = client.handshake.auth.token;
      }

      // 2. Try Authorization header
      if (!token && client.handshake.headers.authorization) {
        token = client.handshake.headers.authorization;
      }

      // 3. Try cookies (new secure method)
      if (!token && client.handshake.headers.cookie) {
        const cookieString = client.handshake.headers.cookie;
        const accessTokenMatch = cookieString.match(/access_token=([^;]+)/);
        if (accessTokenMatch) {
          token = accessTokenMatch[1];
        }
      }

      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Remove "Bearer " if present
      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken, {
        secret: getJwtSecret(),
      });

      // Store user info in socket
      client.data.user = payload;
      this.logger.debug(
        `Client ${client.id} connected, tenant: ${payload.tenantId}`,
      );

      const { tenantId, role, sub: userId } = payload;

      // Join Rooms based on Role

      // 1. Internal Team Room (Admins & Staff)
      if (role === 'admin' || role === 'superadmin' || role === 'staff') {
        client.join(`tenant-${tenantId}-INTERNAL`);
        client.join(`tenant-${tenantId}-SUPPORT`); // Admins receive support messages from Superadmin
      }

      // 2. Customer Personal Room (Everyone joins their own customer room)
      // Even admins join their own "customer" room potentially, but mainly Clients join this.
      // Format: tenant-{id}-customer-{userId}
      client.join(`tenant-${tenantId}-customer-${userId}`);

      // 3. Superadmin Global Support (Optional, or they subscribe on demand)
      if (role === 'superadmin') {
        client.join('global-support');
      }

      // 4. Admin listening to ALL customers?
      // If admin wants to hear all customers, they join `tenant-{id}-customers-all`?
      // Or we broadcast to `tenant-{id}-INTERNAL` for customer messages too?
      // Let's keep it simple: Admins join `tenant-{id}-INTERNAL` and we might send notifications there.
      // But for "Customer Chat", it's 1-on-1.
      // Admins need to receive messages from ANY customer.
      if (role === 'admin' || role === 'superadmin') {
        client.join(`tenant-${tenantId}-customers-all`);
      }
    } catch (error) {
      this.logger.warn(`Connection unauthorized: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      content: string;
      scope?: string;
      targetUserId?: string;
      mediaUrl?: string;
      type?: string;
    },
  ) {
    const user = client.data.user;
    if (!user) return;

    const scope = payload.scope || 'INTERNAL';

    // DEBUG: Log the incoming message details
    this.logger.debug(
      `[DEBUG] sendMessage received - user: ${user.sub}, role: ${user.role}, scope: ${scope}, targetUserId: ${payload.targetUserId}, currentTenantId: ${client.data.currentTenantId}, jwtTenantId: ${user.tenantId}`,
    );

    // Fix: If I am a customer, I am the target of this conversation
    let dbTargetUserId = payload.targetUserId;
    if (scope === 'CUSTOMER' && !dbTargetUserId && user.role === 'user') {
      dbTargetUserId = user.sub;
    }

    // For superadmin, use currentTenantId if set, otherwise use JWT tenantId
    const effectiveTenantId = client.data.currentTenantId || user.tenantId;

    this.logger.debug(`[DEBUG] Effective tenantId: ${effectiveTenantId}`);

    if (!effectiveTenantId) {
      this.logger.warn(`Message rejected: no tenantId for user ${user.sub}`);
      return { success: false, message: 'No tenant selected' };
    }

    this.logger.debug(
      `Message from user ${user.sub}, scope: ${scope}, tenant: ${effectiveTenantId}`,
    );

    try {
      // Save User Message
      const message = await this.chatService.createMessage(
        payload.content,
        user.sub, // userId from JWT
        effectiveTenantId,
        scope,
        dbTargetUserId,
        false,
        payload.mediaUrl,
        payload.type || 'text',
      );

      // Helper to Broadcast
      const broadcastMessage = (msg: any) => {
        const tenantId = effectiveTenantId;
        this.logger.debug(
          `[DEBUG] Broadcasting message ${msg.id} to scope ${scope}, tenantId: ${tenantId}`,
        );
        if (scope === 'INTERNAL') {
          this.logger.debug(
            `[DEBUG] Broadcasting to room: tenant-${tenantId}-INTERNAL`,
          );
          this.server.to(`tenant-${tenantId}-INTERNAL`).emit('newMessage', msg);
        } else if (scope === 'SUPPORT') {
          this.logger.debug(
            `[DEBUG] Broadcasting to room: tenant-${tenantId}-SUPPORT`,
          );
          this.server.to(`tenant-${tenantId}-SUPPORT`).emit('newMessage', msg);
        } else if (scope === 'CUSTOMER') {
          const effectiveTargetId = dbTargetUserId || user.sub;
          this.logger.debug(
            `[DEBUG] Broadcasting CUSTOMER message to: tenant-${tenantId}-customer-${effectiveTargetId} AND tenant-${tenantId}-customers-all`,
          );
          this.server
            .to(`tenant-${tenantId}-customer-${effectiveTargetId}`)
            .emit('newMessage', msg);
          this.server
            .to(`tenant-${tenantId}-customers-all`)
            .emit('newMessage', msg);
        }
      };

      broadcastMessage(message);

      // AI Logic
      // Only trigger AI for CUSTOMER scope and when sender is a USER (Client)
      if (scope !== 'CUSTOMER' || user.role !== 'user') {
        return;
      }

      // Check if AI is active for this user
      let isAiActive = true;
      if (scope === 'CUSTOMER' && dbTargetUserId) {
        const targetUser = await this.usersService.findOne(dbTargetUserId);
        if (targetUser) {
          isAiActive = targetUser.isAiChatActive;
        }
      }

      if (!isAiActive) {
        this.logger.debug(`AI paused for user ${dbTargetUserId}`);
        return; // AI is paused for this user
      }

      // Trigger AI response if applicable
      this.logger.debug(`Triggering AI for tenant ${effectiveTenantId}`);

      // Fetch context (previous messages)
      let context: any[] = [];
      try {
        const history = await this.chatService.getMessages(
          effectiveTenantId,
          scope,
          dbTargetUserId,
          10,
        );
        // Filter out the current message (which is the last one saved)
        // And map to OpenAI format
        context = history
          .filter((m) => m.id !== message.id) // Exclude current message
          .map((m) => ({
            role: m.isAi || !m.senderId ? 'assistant' : 'user',
            content: m.content,
          }));
      } catch (err) {
        this.logger.error('Error fetching chat history for AI context', err);
      }

      const aiResult = await this.aiService.generateReply(
        scope,
        payload.content,
        effectiveTenantId,
        context,
      );

      // Check if AI requested a pause (Handoff)
      if (aiResult.shouldPauseAi && scope === 'CUSTOMER' && dbTargetUserId) {
        await this.usersService.update(dbTargetUserId, {
          isAiChatActive: false,
        });
        // Notify admins via socket? The message content already says "Pausaré..."
        // We could emit a specific event "aiPaused" to update UI immediately
        this.server
          .to(`tenant-${effectiveTenantId}-customers-all`)
          .emit('aiStatusChanged', {
            userId: dbTargetUserId,
            isAiActive: false,
          });
      }

      if (aiResult.content) {
        const aiMessage = await this.chatService.createMessage(
          aiResult.content,
          null, // Sender is NULL (AI)
          effectiveTenantId,
          scope,
          dbTargetUserId,
          true, // isAi = true
        );
        broadcastMessage(aiMessage);
      }
    } catch (error) {
      this.logger.error('Error handling message', error);
    }
  }

  @SubscribeMessage('toggleAi')
  async handleToggleAi(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; isActive: boolean },
  ) {
    const user = client.data.user;
    if (
      !user ||
      (user.role !== 'admin' &&
        user.role !== 'superadmin' &&
        user.role !== 'staff')
    ) {
      return; // Only staff can toggle AI
    }

    // For superadmin, use currentTenantId if set
    const effectiveTenantId = client.data.currentTenantId || user.tenantId;

    if (!effectiveTenantId) {
      this.logger.warn(`ToggleAI rejected: no tenantId for user ${user.sub}`);
      return { success: false, message: 'No tenant selected' };
    }

    await this.usersService.update(payload.userId, {
      isAiChatActive: payload.isActive,
    });

    // Notify relevant rooms
    this.server
      .to(`tenant-${effectiveTenantId}-customers-all`)
      .emit('aiStatusChanged', {
        userId: payload.userId,
        isAiActive: payload.isActive,
      });

    // Also notify the user's room if needed?
    // Maybe send a system message?
    const systemMsg = payload.isActive
      ? '🤖 El asistente automático ha sido reactivado.'
      : '👤 Un agente humano se ha unido a la conversación.';

    const message = await this.chatService.createMessage(
      systemMsg,
      null,
      effectiveTenantId,
      'CUSTOMER',
      payload.userId,
      true, // marked as AI/System
    );

    this.server
      .to(`tenant-${effectiveTenantId}-customer-${payload.userId}`)
      .emit('newMessage', message);
    this.server
      .to(`tenant-${effectiveTenantId}-customers-all`)
      .emit('newMessage', message);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
  }

  /**
   * Allows superadmin to switch between tenants in real-time
   * When superadmin selects a different tenant, they join that tenant's rooms
   */
  @SubscribeMessage('switchTenant')
  async handleSwitchTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string },
  ) {
    const user = client.data.user;

    // Only allow superadmin to switch tenants
    if (!user || user.role !== 'superadmin') {
      this.logger.warn('Non-superadmin attempted to switch tenant');
      return { success: false, message: 'Unauthorized' };
    }

    const { tenantId } = payload;
    this.logger.log(
      `[DEBUG] switchTenant called - Superadmin ${user.sub} switching to tenant ${tenantId}, previous currentTenantId: ${client.data.currentTenantId}`,
    );

    // Leave all current tenant rooms (to avoid flooding)
    const currentRooms = Array.from(client.rooms);
    this.logger.debug(
      `[DEBUG] Current rooms before switch: ${currentRooms.filter((r) => r.startsWith('tenant-')).join(', ')}`,
    );

    currentRooms.forEach((room) => {
      if (
        room.startsWith('tenant-') &&
        room !== `tenant-${tenantId}-INTERNAL`
      ) {
        client.leave(room);
      }
    });

    // Join new tenant rooms
    client.join(`tenant-${tenantId}-INTERNAL`);
    client.join(`tenant-${tenantId}-SUPPORT`);
    client.join(`tenant-${tenantId}-customers-all`);
    client.join(`tenant-${tenantId}-customer-${user.sub}`);

    // Store the current tenant in socket data
    client.data.currentTenantId = tenantId;

    const newRooms = Array.from(client.rooms);
    this.logger.log(
      `[DEBUG] Superadmin switched to tenant ${tenantId} - New rooms: ${newRooms.filter((r) => r.startsWith('tenant-')).join(', ')}`,
    );
    return { success: true, tenantId };
  }
}
