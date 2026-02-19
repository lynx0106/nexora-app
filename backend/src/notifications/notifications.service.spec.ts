import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { Repository } from 'typeorm';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepo: jest.Mocked<Repository<Notification>>;
  let notificationsGateway: jest.Mocked<NotificationsGateway>;

  const mockNotification = {
    id: 'notification-123',
    tenantId: 'tenant-123',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info',
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockNotificationRepo = {
      create: jest.fn().mockReturnValue(mockNotification),
      save: jest.fn().mockResolvedValue(mockNotification),
      find: jest.fn().mockResolvedValue([mockNotification]),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockNotificationsGateway = {
      sendToUser: jest.fn(),
      sendToTenantAdmins: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepo },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepo = module.get(getRepositoryToken(Notification));
    notificationsGateway = module.get(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAndBroadcast', () => {
    it('should create and broadcast notification to specific user', async () => {
      const data = {
        tenantId: 'tenant-123',
        title: 'New Order',
        message: 'You have a new order',
        type: 'info',
        userId: 'user-123',
      };

      const result = await service.createAndBroadcast(data);

      expect(result).toBeDefined();
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: data.tenantId,
          title: data.title,
          message: data.message,
          userId: data.userId,
          isRead: false,
        }),
      );
      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        data.userId,
        mockNotification,
      );
    });

    it('should create and broadcast notification to tenant admins', async () => {
      const data = {
        tenantId: 'tenant-123',
        title: 'New Order',
        message: 'You have a new order',
      };

      const result = await service.createAndBroadcast(data);

      expect(result).toBeDefined();
      expect(notificationsGateway.sendToTenantAdmins).toHaveBeenCalledWith(
        data.tenantId,
        mockNotification,
      );
    });

    it('should default type to info if not provided', async () => {
      const data = {
        tenantId: 'tenant-123',
        title: 'Test',
        message: 'Test message',
      };

      await service.createAndBroadcast(data);

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
        }),
      );
    });
  });

  describe('findAllUnread', () => {
    it('should return unread notifications for user', async () => {
      notificationRepo.find.mockResolvedValue([mockNotification] as any);

      const result = await service.findAllUnread('tenant-123', 'user-123');

      expect(result).toEqual([mockNotification]);
      expect(notificationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await service.markAsRead('notification-123');

      expect(result).toEqual({ success: true });
      expect(notificationRepo.update).toHaveBeenCalledWith('notification-123', {
        isRead: true,
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      const result = await service.markAllAsRead('tenant-123', 'user-123');

      expect(result).toEqual({ success: true });
      expect(notificationRepo.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-123', userId: 'user-123', isRead: false },
        { isRead: true },
      );
    });
  });
});
