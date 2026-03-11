import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UsersService } from './users/users.service';
import { TenantsService } from './tenants/tenants.service';
import { TasksService } from './tasks/tasks.service';

describe('AppController', () => {
  let appController: AppController;

  const mockUsersService = { findByEmail: jest.fn() };
  const mockTenantsService = { findById: jest.fn() };
  const mockTasksService = {
    runAllTasks: jest.fn().mockResolvedValue({}),
    handleAppointmentReminders: jest.fn().mockResolvedValue(undefined),
    handleCleanup: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return status ok', () => {
      const health = appController.health();
      expect(health.status).toBe('ok');
      expect(typeof health.timestamp).toBe('string');
      expect(health.service).toBe('nexora-api');
      if (health.uptime != null) expect(typeof health.uptime).toBe('number');
    });
  });
});
