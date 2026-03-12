import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { InvitationsService } from '../invitations/invitations.service';
import { AuthService } from '../auth/auth.service';

describe('TasksService', () => {
  let service: TasksService;
  let appointmentsService: jest.Mocked<AppointmentsService>;
  let invitationsService: jest.Mocked<InvitationsService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAppointmentsService = {
      sendReminders: jest.fn().mockResolvedValue(undefined),
    };
    const mockInvitationsService = {
      markExpiredInvitations: jest.fn().mockResolvedValue(undefined),
    };
    const mockAuthService = {
      cleanupExpiredTokens: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: AppointmentsService, useValue: mockAppointmentsService },
        { provide: InvitationsService, useValue: mockInvitationsService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    appointmentsService = module.get(AppointmentsService);
    invitationsService = module.get(InvitationsService);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runAllTasks', () => {
    it('should run all tasks and return completed for each', async () => {
      const result = await service.runAllTasks();

      expect(appointmentsService.sendReminders).toHaveBeenCalled();
      expect(invitationsService.markExpiredInvitations).toHaveBeenCalled();
      expect(authService.cleanupExpiredTokens).toHaveBeenCalled();

      expect(result).toEqual({
        appointments: 'completed',
        invitations: 'completed',
        tokens: 'completed',
      });
    });

    it('should report failed when appointments sendReminders fails', async () => {
      appointmentsService.sendReminders.mockRejectedValue(
        new Error('SMTP Error'),
      );

      const result = await service.runAllTasks();

      expect(result.appointments).toBe('failed');
      expect(result.invitations).toBe('completed');
      expect(result.tokens).toBe('completed');
    });

    it('should report failed when invitations markExpiredInvitations fails', async () => {
      invitationsService.markExpiredInvitations.mockRejectedValue(
        new Error('DB Error'),
      );

      const result = await service.runAllTasks();

      expect(result.appointments).toBe('completed');
      expect(result.invitations).toBe('failed');
      expect(result.tokens).toBe('completed');
    });

    it('should report failed when auth cleanupExpiredTokens fails', async () => {
      authService.cleanupExpiredTokens.mockRejectedValue(
        new Error('Token Error'),
      );

      const result = await service.runAllTasks();

      expect(result.appointments).toBe('completed');
      expect(result.invitations).toBe('completed');
      expect(result.tokens).toBe('failed');
    });

    it('should continue running remaining tasks when one fails', async () => {
      appointmentsService.sendReminders.mockRejectedValue(new Error('Fail'));

      const result = await service.runAllTasks();

      expect(invitationsService.markExpiredInvitations).toHaveBeenCalled();
      expect(authService.cleanupExpiredTokens).toHaveBeenCalled();
      expect(result.appointments).toBe('failed');
    });
  });

  describe('handleAppointmentReminders', () => {
    it('should call appointmentsService.sendReminders', async () => {
      await service.handleAppointmentReminders();

      expect(appointmentsService.sendReminders).toHaveBeenCalled();
    });

    it('should not throw when sendReminders fails', async () => {
      appointmentsService.sendReminders.mockRejectedValue(new Error('Fail'));

      await expect(service.handleAppointmentReminders()).resolves.not.toThrow();
    });
  });

  describe('handleCleanup', () => {
    it('should call markExpiredInvitations and cleanupExpiredTokens', async () => {
      await service.handleCleanup();

      expect(invitationsService.markExpiredInvitations).toHaveBeenCalled();
      expect(authService.cleanupExpiredTokens).toHaveBeenCalled();
    });

    it('should not throw when markExpiredInvitations fails', async () => {
      invitationsService.markExpiredInvitations.mockRejectedValue(
        new Error('Fail'),
      );

      await expect(service.handleCleanup()).resolves.not.toThrow();
      expect(authService.cleanupExpiredTokens).toHaveBeenCalled();
    });

    it('should not throw when cleanupExpiredTokens fails', async () => {
      authService.cleanupExpiredTokens.mockRejectedValue(new Error('Fail'));

      await expect(service.handleCleanup()).resolves.not.toThrow();
    });
  });
});
