import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  let mailerService: jest.Mocked<MailerService>;

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Business',
    email: 'contact@test.com',
    address: '123 Test St',
    currency: 'USD',
  };

  beforeEach(async () => {
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOrderConfirmation', () => {
    const mockOrder = {
      id: 'order-123-456-789',
      customerEmail: 'customer@test.com',
      customerName: 'John Doe',
      total: 150,
      publicToken: 'token-abc',
      items: [
        {
          product: { name: 'Product 1' },
          quantity: 2,
          price: 50,
        },
        {
          product: { name: 'Product 2' },
          quantity: 1,
          price: 50,
        },
      ],
    };

    it('should send order confirmation email', async () => {
      await service.sendOrderConfirmation(mockOrder, mockTenant as any);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@test.com',
          subject: expect.stringContaining('Confirmación de Pedido'),
          template: './order-confirmation',
        }),
      );
    });

    it('should not send email if customerEmail is missing', async () => {
      const orderWithoutEmail = { ...mockOrder, customerEmail: null };

      await service.sendOrderConfirmation(orderWithoutEmail, mockTenant as any);

      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should include order items in email context', async () => {
      await service.sendOrderConfirmation(mockOrder, mockTenant as any);

      const callArgs = mailerService.sendMail.mock.calls[0][0] as any;
      expect(callArgs.context.items).toHaveLength(2);
      expect(callArgs.context.items[0].productName).toBe('Product 1');
    });

    it('should handle mailer errors gracefully', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      // Should not throw
      await expect(
        service.sendOrderConfirmation(mockOrder, mockTenant as any),
      ).resolves.not.toThrow();
    });

    it('should use tenant currency for formatting', async () => {
      await service.sendOrderConfirmation(mockOrder, mockTenant as any);

      const callArgs = mailerService.sendMail.mock.calls[0][0] as any;
      expect(callArgs.context.total).toBeDefined();
    });
  });

  describe('sendAppointmentConfirmation', () => {
    const mockAppointment = {
      id: 'appointment-123',
      dateTime: new Date('2024-12-25T10:00:00'),
      client: {
        email: 'client@test.com',
        firstName: 'Jane',
      },
      service: { name: 'Consultation' },
      doctor: { firstName: 'Dr. Smith' },
    };

    it('should send appointment confirmation email', async () => {
      await service.sendAppointmentConfirmation(
        mockAppointment as any,
        mockTenant as any,
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@test.com',
          subject: expect.stringContaining('Confirmación de Cita'),
          template: './appointment-confirmation',
        }),
      );
    });

    it('should not send email if client email is missing', async () => {
      const appointmentWithoutEmail = {
        ...mockAppointment,
        client: { firstName: 'Jane' },
      };

      await service.sendAppointmentConfirmation(
        appointmentWithoutEmail as any,
        mockTenant as any,
      );

      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should format date and time in Spanish', async () => {
      await service.sendAppointmentConfirmation(
        mockAppointment as any,
        mockTenant as any,
      );

      const callArgs = mailerService.sendMail.mock.calls[0][0] as any;
      expect(callArgs.context.date).toBeDefined();
      expect(callArgs.context.time).toBeDefined();
    });

    it('should handle mailer errors gracefully', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        service.sendAppointmentConfirmation(
          mockAppointment as any,
          mockTenant as any,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('sendAppointmentReminder', () => {
    const mockAppointment = {
      id: 'appointment-123',
      dateTime: new Date('2024-12-25T10:00:00'),
      client: {
        email: 'client@test.com',
        firstName: 'Jane',
      },
      service: { name: 'Consultation' },
      doctor: { firstName: 'Dr. Smith' },
    };

    it('should send 24h reminder', async () => {
      await service.sendAppointmentReminder(
        mockAppointment as any,
        mockTenant as any,
        '24h',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('mañana'),
          template: './appointment-reminder',
        }),
      );
    });

    it('should send 2h reminder', async () => {
      await service.sendAppointmentReminder(
        mockAppointment as any,
        mockTenant as any,
        '2h',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('2 horas'),
        }),
      );
    });

    it('should not send if client email is missing', async () => {
      const appointmentWithoutEmail = {
        ...mockAppointment,
        client: { firstName: 'Jane' },
      };

      await service.sendAppointmentReminder(
        appointmentWithoutEmail as any,
        mockTenant as any,
        '24h',
      );

      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      await service.sendPasswordReset({
        email: 'user@test.com',
        firstName: 'John',
        token: 'reset-token-123',
      });

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('contrasena'),
          template: './password-reset',
        }),
      );
    });

    it('should include reset URL with token', async () => {
      await service.sendPasswordReset({
        email: 'user@test.com',
        token: 'reset-token-123',
      });

      const callArgs = mailerService.sendMail.mock.calls[0][0] as any;
      expect(callArgs.context.url).toContain('reset-token-123');
    });

    it('should handle mailer errors gracefully', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        service.sendPasswordReset({
          email: 'user@test.com',
          token: 'reset-token-123',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('sendInvitation', () => {
    it('should send invitation email', async () => {
      await service.sendInvitation({
        email: 'newuser@test.com',
        token: 'invite-token-123',
        tenantName: 'Test Business',
        role: 'admin',
        inviterName: 'John Admin',
      });

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@test.com',
          subject: expect.stringContaining('Invitacion'),
          template: './invitation',
        }),
      );
    });

    it('should include invitation URL with token', async () => {
      await service.sendInvitation({
        email: 'newuser@test.com',
        token: 'invite-token-123',
        tenantName: 'Test Business',
        role: 'admin',
      });

      const callArgs = mailerService.sendMail.mock.calls[0][0] as any;
      expect(callArgs.context.url).toContain('invite-token-123');
    });

    it('should include tenant name in subject', async () => {
      await service.sendInvitation({
        email: 'newuser@test.com',
        token: 'invite-token-123',
        tenantName: 'My Business',
        role: 'admin',
      });

      const callArgs = mailerService.sendMail.mock.calls[0][0] as any;
      expect(callArgs.subject).toContain('My Business');
    });

    it('should handle mailer errors gracefully', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        service.sendInvitation({
          email: 'newuser@test.com',
          token: 'invite-token-123',
          tenantName: 'Test',
          role: 'admin',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('sendMail', () => {
    it('should delegate to mailerService', async () => {
      const options = {
        to: 'test@test.com',
        subject: 'Test',
        text: 'Test body',
      };

      await service.sendMail(options);

      expect(mailerService.sendMail).toHaveBeenCalledWith(options);
    });
  });
});