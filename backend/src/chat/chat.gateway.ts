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
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;
      if (!token) {
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
      this.logger.debug(`Client ${client.id} connected, tenant: ${payload.tenantId}`);

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
    // Fix: If I am a customer, I am the target of this conversation
    let dbTargetUserId = payload.targetUserId;
    if (scope === 'CUSTOMER' && !dbTargetUserId && user.role === 'user') {
      dbTargetUserId = user.sub;
    }

    this.logger.debug(`Message from user ${user.sub}, scope: ${scope}, tenant: ${user.tenantId}`);

    try {
      // Save User Message
      const message = await this.chatService.createMessage(
        payload.content,
        user.sub, // userId from JWT
        user.tenantId,
        scope,
        dbTargetUserId,
        false,
        payload.mediaUrl,
        payload.type || 'text',
      );

      // Helper to Broadcast
      const broadcastMessage = (msg: any) => {
        const tenantId = user.tenantId;
        this.logger.debug(`Broadcasting message ${msg.id} to scope ${scope}`);
        if (scope === 'INTERNAL') {
          this.server.to(`tenant-${tenantId}-INTERNAL`).emit('newMessage', msg);
        } else if (scope === 'SUPPORT') {
          this.server.to(`tenant-${tenantId}-SUPPORT`).emit('newMessage', msg);
        } else if (scope === 'CUSTOMER') {
          const effectiveTargetId = dbTargetUserId || user.sub;
          this.logger.debug(`Target room: tenant-${tenantId}-customer-${effectiveTargetId}`);
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
      this.logger.debug(`Triggering AI for tenant ${user.tenantId}`);

      // Fetch context (previous messages)
      let context: any[] = [];
      try {
        const history = await this.chatService.getMessages(
          user.tenantId,
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
        user.tenantId,
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
          .to(`tenant-${user.tenantId}-customers-all`)
          .emit('aiStatusChanged', {
            userId: dbTargetUserId,
            isAiActive: false,
          });
      }

      if (aiResult.content) {
        const aiMessage = await this.chatService.createMessage(
          aiResult.content,
          null, // Sender is NULL (AI)
          user.tenantId,
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

    await this.usersService.update(payload.userId, {
      isAiChatActive: payload.isActive,
    });

    // Notify relevant rooms
    this.server
      .to(`tenant-${user.tenantId}-customers-all`)
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
      user.tenantId,
      'CUSTOMER',
      payload.userId,
      true, // marked as AI/System
    );

    this.server
      .to(`tenant-${user.tenantId}-customer-${payload.userId}`)
      .emit('newMessage', message);
    this.server
      .to(`tenant-${user.tenantId}-customers-all`)
      .emit('newMessage', message);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
  }
}
