import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;
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
      if (role === 'admin' || role === 'superadmin' || role === 'staff') {
        client.join(`tenant-${tenantId}-admins`);
      }

      console.log(
        `[Notifications] Client connected: ${client.id}, User: ${payload.email}`,
      );
    } catch (error) {
      console.error('[Notifications] Connection unauthorized:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // console.log(`[Notifications] Client disconnected: ${client.id}`);
  }

  // Method to send notification to a specific user
  sendToUser(userId: string, notification: any) {
    if (!this.server) {
      console.warn(
        '[NotificationsGateway] WebSocket server not initialized. Skipping notification to user.',
      );
      return;
    }
    this.server.to(`user-${userId}`).emit('notification', notification);
  }

  // Method to send notification to all admins of a tenant
  sendToTenantAdmins(tenantId: string, notification: any) {
    if (!this.server) {
      console.warn(
        '[NotificationsGateway] WebSocket server not initialized. Skipping notification to admins.',
      );
      return;
    }
    this.server
      .to(`tenant-${tenantId}-admins`)
      .emit('notification', notification);
  }
}
