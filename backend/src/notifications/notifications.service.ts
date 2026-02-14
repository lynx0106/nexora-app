import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createAndBroadcast(data: {
    tenantId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
    userId?: string; // If null, broadcast to all admins
  }) {
    const notification = this.notificationsRepository.create({
      tenantId: data.tenantId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      link: data.link,
      userId: data.userId,
      isRead: false,
    });

    const saved = await this.notificationsRepository.save(notification);

    if (data.userId) {
      this.notificationsGateway.sendToUser(data.userId, saved);
    } else {
      this.notificationsGateway.sendToTenantAdmins(data.tenantId, saved);
    }

    return saved;
  }

  async findAllUnread(tenantId: string, userId: string) {
    // Return notifications for this user OR general tenant notifications (userId is null)
    return this.notificationsRepository.find({
      where: [
        { tenantId, userId, isRead: false },
        { tenantId, userId: IsNull(), isRead: false }, // Broadcasts
      ],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(id: string) {
    await this.notificationsRepository.update(id, { isRead: true });
    return { success: true };
  }

  async markAllAsRead(tenantId: string, userId: string) {
    // Mark user specific
    await this.notificationsRepository.update(
      { tenantId, userId, isRead: false },
      { isRead: true },
    );
    // Note: Marking broadcast notifications as read for ONE user is tricky in this simple schema.
    // Ideally, we'd have a NotificationRead recipient table.
    // For now, we'll accept that "Mark All Read" might only clear personal ones or we update the broadcast one (which clears for everyone - not ideal but simple for MVP).
    // Let's just update personal ones for now to avoid side effects.
    return { success: true };
  }
}
