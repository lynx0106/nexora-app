import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getCorsOrigins, getJwtSecret } from '../config/runtime.config';

@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
  namespace: '/notifications', // Separate namespace to avoid conflict/noise with chat
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwtService: JwtService) {}

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
        client.disconnect();
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken, {
        secret: getJwtSecret(),
      });

      client.data.user = payload;
      const { tenantId, role, sub: userId } = payload;

      // User specific channel
      client.join(`user-${userId}`);

      // Tenant admin channel (for orders, appointments, etc.)
      if (role === 'admin' || role === 'superadmin' || role === 'employee') {
        client.join(`tenant-${tenantId}-admins`);
      }
    } catch (error) {
      void error;
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Client disconnected - cleanup is automatic via Socket.io
    void client;
  }

  // Method to send notification to a specific user
  sendToUser(userId: string, notification: any) {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized. Skipping notification to user.',
      );
      return;
    }
    this.server.to(`user-${userId}`).emit('notification', notification);
  }

  // Method to send notification to all admins of a tenant
  sendToTenantAdmins(tenantId: string, notification: any) {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized. Skipping notification to admins.',
      );
      return;
    }
    this.server
      .to(`tenant-${tenantId}-admins`)
      .emit('notification', notification);
  }
}
