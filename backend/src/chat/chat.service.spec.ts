import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';

describe('ChatService', () => {
  let service: ChatService;
  let messageRepo: jest.Mocked<Repository<Message>>;

  const mockMessage = {
    id: 'message-123',
    content: 'Test message',
    senderId: 'user-123',
    tenantId: 'tenant-123',
    scope: 'INTERNAL',
    targetUserId: null,
    isAi: false,
    isRead: false,
    type: 'text',
    createdAt: new Date(),
    sender: { id: 'user-123', firstName: 'Test', lastName: 'User' },
  };

  beforeEach(async () => {
    const mockMessageRepo = {
      create: jest.fn().mockReturnValue(mockMessage),
      save: jest.fn().mockResolvedValue(mockMessage),
      findOne: jest.fn().mockResolvedValue(mockMessage),
      find: jest.fn().mockResolvedValue([mockMessage]),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 'user-456' }]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
        getCount: jest.fn().mockResolvedValue(5),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    messageRepo = module.get(getRepositoryToken(Message));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const result = await service.createMessage(
        'Hello world',
        'user-123',
        'tenant-123',
        'INTERNAL',
      );

      expect(result).toBeDefined();
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello world',
          tenantId: 'tenant-123',
          scope: 'INTERNAL',
        }),
      );
      expect(messageRepo.save).toHaveBeenCalled();
    });

    it('should create an AI message', async () => {
      await service.createMessage(
        'AI response',
        null,
        'tenant-123',
        'INTERNAL',
        undefined,
        true,
      );

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isAi: true,
        }),
      );
    });

    it('should create a customer message with target user', async () => {
      await service.createMessage(
        'Customer message',
        'user-123',
        'tenant-123',
        'CUSTOMER',
        'user-456',
      );

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'CUSTOMER',
          targetUserId: 'user-456',
        }),
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages for tenant and scope', async () => {
      const result = await service.getMessages('tenant-123', 'INTERNAL');

      expect(result).toEqual([mockMessage]);
      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-123', scope: 'INTERNAL' },
          order: { createdAt: 'ASC' },
        }),
      );
    });

    it('should filter by targetUserId for CUSTOMER scope', async () => {
      await service.getMessages('tenant-123', 'CUSTOMER', 'user-456');

      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetUserId: 'user-456',
          }),
        }),
      );
    });

    it('should respect limit parameter', async () => {
      await service.getMessages('tenant-123', 'INTERNAL', undefined, 100);

      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('getConversations', () => {
    it('should return distinct target user IDs', async () => {
      const result = await service.getConversations('tenant-123');

      expect(result).toEqual(['user-456']);
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      await service.markAsRead('tenant-123', 'INTERNAL', 'user-123');

      expect(messageRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter by targetUserId for CUSTOMER scope', async () => {
      await service.markAsRead('tenant-123', 'CUSTOMER', 'user-123', 'user-456');

      expect(messageRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user role', async () => {
      const result = await service.getUnreadCount(
        'tenant-123',
        'user-123',
        'user',
      );

      expect(result).toBe(5);
    });

    it('should return unread count for staff role', async () => {
      const result = await service.getUnreadCount(
        'tenant-123',
        'staff-123',
        'staff',
      );

      expect(result).toBe(5);
    });
  });
});
