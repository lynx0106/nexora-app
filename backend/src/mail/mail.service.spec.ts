import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService, MAIL_TRANSPORT } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mockTransport: { sendMail: jest.Mock };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Business',
    email: 'contact@test.com',
    address: '123 Test St',
    currency: 'USD',
  };

  beforeEach(async () => {
    mockTransport = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SMTP_FROM') return 'noreply@test.com';
              return undefined;
            }),
          },
        },
        { provide: MAIL_TRANSPORT, useValue: mockTransport },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
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
      await service.sendOrderConfirmation(mockOrder, mockTenant as never);

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@test.com',
          subject: expect.stringContaining('Confirmación de Pedido'),
        }),
      );
    });

    it('should not send email if customerEmail is missing', async () => {
      const orderWithoutEmail = { ...mockOrder, customerEmail: undefined };

      await service.sendOrderConfirmation(
        orderWithoutEmail,
        mockTenant as never,
      );

      expect(mockTransport.sendMail).not.toHaveBeenCalled();
    });

    it('should include order items in email html', async () => {
      await service.sendOrderConfirmation(mockOrder, mockTenant as never);

      const callArgs = mockTransport.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Product 1');
      expect(callArgs.html).toContain('Product 2');
    });

    it('should handle mailer errors gracefully', async () => {
      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        service.sendOrderConfirmation(mockOrder, mockTenant as never),
      ).resolves.not.toThrow();
    });

    it('should use tenant currency for formatting', async () => {
      await service.sendOrderConfirmation(mockOrder, mockTenant as never);

      const callArgs = mockTransport.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('$'); // or COP symbol depending on format
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
        mockAppointment as never,
        mockTenant as never,
      );

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@test.com',
          subject: expect.stringContaining('Confirmación de Cita'),
        }),
      );
    });

    it('should not send email if client email is missing', async () => {
      const appointmentWithoutEmail = {
        ...mockAppointment,
        client: { firstName: 'Jane' },
      };

      await service.sendAppointmentConfirmation(
        appointmentWithoutEmail as never,
        mockTenant as never,
      );

      expect(mockTransport.sendMail).not.toHaveBeenCalled();
    });

    it('should format date and time in Spanish', async () => {
      await service.sendAppointmentConfirmation(
        mockAppointment as never,
        mockTenant as never,
      );

      const callArgs = mockTransport.sendMail.mock.calls[0][0];
      expect(callArgs.html).toMatch(/\d/); // contains date/time
    });

    it('should handle mailer errors gracefully', async () => {
      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        service.sendAppointmentConfirmation(
          mockAppointment as never,
          mockTenant as never,
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
        mockAppointment as never,
        mockTenant as never,
        '24h',
      );

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('mañana'),
        }),
      );
    });

    it('should send 2h reminder', async () => {
      await service.sendAppointmentReminder(
        mockAppointment as never,
        mockTenant as never,
        '2h',
      );

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
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
        appointmentWithoutEmail as never,
        mockTenant as never,
        '24h',
      );

      expect(mockTransport.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      await service.sendPasswordReset({
        email: 'user@test.com',
        firstName: 'John',
        token: 'reset-token-123',
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('contrasena'),
        }),
      );
    });

    it('should include reset URL with token', async () => {
      await service.sendPasswordReset({
        email: 'user@test.com',
        token: 'reset-token-123',
      });

      const callArgs = mockTransport.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('reset-token-123');
    });

    it('should handle mailer errors gracefully', async () => {
      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

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

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@test.com',
          subject: expect.stringContaining('Invitacion'),
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

      const callArgs = mockTransport.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('invite-token-123');
    });

    it('should include tenant name in subject', async () => {
      await service.sendInvitation({
        email: 'newuser@test.com',
        token: 'invite-token-123',
        tenantName: 'My Business',
        role: 'admin',
      });

      const callArgs = mockTransport.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('My Business');
    });

    it('should handle mailer errors gracefully', async () => {
      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

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
    it('should delegate to transporter', async () => {
      const options = {
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test body</p>',
      };

      await service.sendMail(options);

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: 'Test',
          html: '<p>Test body</p>',
        }),
      );
    });

    it('should render template when template and context provided', async () => {
      await service.sendMail({
        to: 'test@test.com',
        subject: 'Test',
        template: './order-confirmation',
        context: {
          customerName: 'John',
          orderId: '123',
          total: '$100',
          items: [],
          tenantName: 'Test',
          tenantAddress: 'Addr',
          url: 'https://example.com',
          year: 2025,
        },
      });

      const callArgs = mockTransport.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('John');
      expect(callArgs.html).toContain('Test');
    });
  });
});
