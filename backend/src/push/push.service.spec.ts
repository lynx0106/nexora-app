import { Test, TestingModule } from '@nestjs/testing';
import { PushService } from './push.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

describe('PushService', () => {
  let service: PushService;

  const mockUserRepository = {
    find: jest.fn().mockResolvedValue([
      { id: 'admin-1', role: 'admin', tenantId: 'tenant-1' },
      { id: 'owner-1', role: 'owner', tenantId: 'tenant-1' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    it('should register a push token for a user', async () => {
      await service.registerToken('user-1', 'ExponentPushToken[xxx]', 'ios');
      const tokens = service.getTokensForUser('user-1');
      expect(tokens.length).toBe(1);
      expect(tokens[0]).toBe('ExponentPushToken[xxx]');
    });

    it('should not duplicate tokens', async () => {
      await service.registerToken('user-1', 'ExponentPushToken[xxx]', 'ios');
      await service.registerToken('user-1', 'ExponentPushToken[xxx]', 'ios');
      const tokens = service.getTokensForUser('user-1');
      expect(tokens.length).toBe(1);
    });

    it('should support multiple tokens per user', async () => {
      await service.registerToken('user-1', 'ExponentPushToken[xxx]', 'ios');
      await service.registerToken('user-1', 'ExponentPushToken[yyy]', 'android');
      const tokens = service.getTokensForUser('user-1');
      expect(tokens.length).toBe(2);
    });
  });

  describe('unregisterToken', () => {
    it('should unregister a push token', async () => {
      await service.registerToken('user-1', 'ExponentPushToken[xxx]', 'ios');
      await service.unregisterToken('ExponentPushToken[xxx]');
      const tokens = service.getTokensForUser('user-1');
      expect(tokens.length).toBe(0);
    });
  });

  describe('getTokensForUser', () => {
    it('should return empty array for user without tokens', () => {
      const tokens = service.getTokensForUser('unknown-user');
      expect(tokens).toEqual([]);
    });
  });

  describe('sendToUser', () => {
    it('should return false if user has no tokens', async () => {
      const result = await service.sendToUser('unknown-user', 'Test', 'Body');
      expect(result).toBe(false);
    });

    it('should attempt to send notification if user has tokens', async () => {
      await service.registerToken('user-1', 'ExponentPushToken[test]', 'ios');
      
      // Mock fetch for testing
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: [{ status: 'ok', id: 'xxx' }] }),
      });

      const result = await service.sendToUser('user-1', 'Test', 'Body');
      expect(result).toBe(true);
    });
  });

  describe('sendToTenantAdmins', () => {
    it('should send notifications to tenant admins', async () => {
      await service.registerToken('admin-1', 'ExponentPushToken[admin]', 'ios');
      
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: [{ status: 'ok' }] }),
      });

      await service.sendToTenantAdmins('tenant-1', 'Test', 'Body');
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('notification helpers', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: [{ status: 'ok' }] }),
      });
    });

    it('should send new order notification', async () => {
      await service.registerToken('admin-1', 'ExponentPushToken[admin]', 'ios');
      await service.notifyNewOrder('tenant-1', 'order-1', 'John Doe', 100);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });

    it('should send new appointment notification', async () => {
      await service.registerToken('admin-1', 'ExponentPushToken[admin]', 'ios');
      await service.notifyNewAppointment('tenant-1', 'apt-1', 'Jane Doe', 'Haircut');
      expect(mockUserRepository.find).toHaveBeenCalled();
    });

    it('should send low stock notification', async () => {
      await service.registerToken('admin-1', 'ExponentPushToken[admin]', 'ios');
      await service.notifyLowStock('tenant-1', 'Shampoo', 5);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });

    it('should send new message notification', async () => {
      await service.registerToken('user-1', 'ExponentPushToken[user]', 'ios');
      await service.notifyNewMessage('user-1', 'John', 'Hello!');
    });
  });
});
