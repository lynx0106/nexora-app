import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
}

export interface PushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  // In-memory store for push tokens (in production, use database)
  private pushTokens: Map<string, PushToken[]> = new Map();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Register a push token for a user
   */
  async registerToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    const userTokens = this.pushTokens.get(userId) || [];
    
    // Remove duplicate tokens
    const existingIndex = userTokens.findIndex(t => t.token === token);
    if (existingIndex >= 0) {
      userTokens[existingIndex].createdAt = new Date();
    } else {
      userTokens.push({
        userId,
        token,
        platform,
        createdAt: new Date(),
      });
    }
    
    this.pushTokens.set(userId, userTokens);
    this.logger.log(`Push token registered for user ${userId} on ${platform}`);
  }

  /**
   * Unregister a push token
   */
  async unregisterToken(token: string): Promise<void> {
    for (const [userId, tokens] of this.pushTokens.entries()) {
      const index = tokens.findIndex(t => t.token === token);
      if (index >= 0) {
        tokens.splice(index, 1);
        this.pushTokens.set(userId, tokens);
        this.logger.log(`Push token unregistered for user ${userId}`);
        break;
      }
    }
  }

  /**
   * Get all tokens for a user
   */
  getTokensForUser(userId: string): string[] {
    const userTokens = this.pushTokens.get(userId) || [];
    return userTokens.map(t => t.token);
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<boolean> {
    const tokens = this.getTokensForUser(userId);
    
    if (tokens.length === 0) {
      this.logger.debug(`No push tokens found for user ${userId}`);
      return false;
    }

    return this.sendPushNotification({
      to: tokens,
      title,
      body,
      data,
      sound: 'default',
    });
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    for (const userId of userIds) {
      await this.sendToUser(userId, title, body, data);
    }
  }

  /**
   * Send push notification to tenant admins
   */
  async sendToTenantAdmins(
    tenantId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const admins = await this.usersRepository.find({
      where: [
        { tenantId, role: 'admin' },
        { tenantId, role: 'owner' },
      ],
    });

    const adminIds = admins.map(a => a.id);
    await this.sendToUsers(adminIds, title, body, data);
  }

  /**
   * Send push notification via Expo Push API
   */
  private async sendPushNotification(message: PushMessage): Promise<boolean> {
    try {
      const messages = Array.isArray(message.to) ? message.to : [message.to];
      
      const payload = messages.map(token => ({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data || {},
        sound: message.sound || 'default',
        badge: message.badge,
      }));

      const response = await fetch(this.expoPushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json() as { data?: Array<{ status: string; id?: string; message?: string }> };
      
      if (result.data) {
        const failedTokens = result.data.filter((ticket: any) => ticket.status === 'error');
        if (failedTokens.length > 0) {
          this.logger.warn(`Some push notifications failed: ${JSON.stringify(failedTokens)}`);
        }
        
        const successCount = result.data.filter((ticket: any) => ticket.status === 'ok').length;
        this.logger.log(`Push notifications sent: ${successCount} successful, ${failedTokens.length} failed`);
        return successCount > 0;
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error}`);
      return false;
    }
  }

  /**
   * Send notification for new order
   */
  async notifyNewOrder(tenantId: string, orderId: string, customerName: string, total: number): Promise<void> {
    await this.sendToTenantAdmins(
      tenantId,
      'Nuevo Pedido',
      `${customerName} ha realizado un pedido de $${total.toFixed(2)}`,
      { type: 'order', orderId },
    );
  }

  /**
   * Send notification for new appointment
   */
  async notifyNewAppointment(tenantId: string, appointmentId: string, clientName: string, serviceName: string): Promise<void> {
    await this.sendToTenantAdmins(
      tenantId,
      'Nueva Cita',
      `${clientName} ha agendado: ${serviceName}`,
      { type: 'appointment', appointmentId },
    );
  }

  /**
   * Send notification for low stock
   */
  async notifyLowStock(tenantId: string, productName: string, currentStock: number): Promise<void> {
    await this.sendToTenantAdmins(
      tenantId,
      'Stock Bajo',
      `${productName} tiene solo ${currentStock} unidades`,
      { type: 'inventory', productName },
    );
  }

  /**
   * Send notification for new message
   */
  async notifyNewMessage(userId: string, senderName: string, messagePreview: string): Promise<void> {
    await this.sendToUser(
      userId,
      `Mensaje de ${senderName}`,
      messagePreview.substring(0, 100),
      { type: 'chat' },
    );
  }
}
