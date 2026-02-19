import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { TenantsService } from '../tenants/tenants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiUsage } from './entities/ai-usage.entity';

describe('AiService', () => {
  let service: AiService;
  let tenantsService: jest.Mocked<TenantsService>;
  let aiUsageRepository: { save: jest.Mock };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Business',
    sector: 'Restaurant',
    country: 'Colombia',
    currency: 'COP',
    openingTime: '09:00',
    closingTime: '18:00',
    aiModel: 'gpt-3.5-turbo',
    openaiApiKey: null,
    aiPromptCustomer: null,
    aiPromptSupport: null,
    aiPromptInternal: null,
  };

  beforeEach(async () => {
    const mockTenantsService = {
      findOne: jest.fn().mockResolvedValue(mockTenant),
    };

    aiUsageRepository = {
      save: jest.fn().mockResolvedValue({ id: 'usage-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: getRepositoryToken(AiUsage), useValue: aiUsageRepository },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    tenantsService = module.get(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReply', () => {
    it('should detect human handoff keywords and pause AI', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        'Quiero hablar con un humano',
        'tenant-123',
      );

      expect(result.shouldPauseAi).toBe(true);
      expect(result.content).toContain('agente humano');
    });

    it('should detect "persona" keyword for human handoff', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        'Necesito hablar con una persona',
        'tenant-123',
      );

      expect(result.shouldPauseAi).toBe(true);
    });

    it('should detect "asesor" keyword for human handoff', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        'Pásame con un asesor',
        'tenant-123',
      );

      expect(result.shouldPauseAi).toBe(true);
    });

    it('should ignore internal messages without @ai or bot tag', async () => {
      const result = await service.generateReply(
        'INTERNAL',
        'Mensaje interno normal',
        'tenant-123',
      );

      expect(result.content).toBeNull();
      expect(result.shouldPauseAi).toBe(false);
    });

    it('should respond to internal messages with @ai tag', async () => {
      const result = await service.generateReply(
        'INTERNAL',
        '@ai ayúdame con esto',
        'tenant-123',
      );

      expect(result.content).not.toBeNull();
    });

    it('should respond to internal messages with bot keyword', async () => {
      const result = await service.generateReply(
        'INTERNAL',
        'bot necesito ayuda',
        'tenant-123',
      );

      expect(result.content).not.toBeNull();
    });

    it('should use mock reply when no OpenAI client available', async () => {
      // No OPENAI_API_KEY in env and no tenant key
      const result = await service.generateReply(
        'CUSTOMER',
        'Hola',
        'tenant-123',
      );

      expect(result.content).not.toBeNull();
      expect(result.shouldPauseAi).toBe(false);
    });
  });

  describe('Mock Reply - Customer Scope', () => {
    it('should respond to price inquiries', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        '¿Cuál es el precio?',
        'tenant-123',
      );

      expect(result.content).toContain('precio');
    });

    it('should respond to schedule inquiries', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        '¿Cuál es el horario?',
        'tenant-123',
      );

      expect(result.content).toContain('horario');
    });

    it('should respond to appointment requests', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        'Quiero agendar una cita',
        'tenant-123',
      );

      expect(result.content).toContain('cita');
    });

    it('should respond to name introduction', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        'Me llamo Juan',
        'tenant-123',
      );

      expect(result.content).toContain('Juan');
    });

    it('should respond to greetings', async () => {
      const result = await service.generateReply(
        'CUSTOMER',
        'Hola',
        'tenant-123',
      );

      expect(result.content).toContain('Hola');
    });
  });

  describe('Mock Reply - Support Scope', () => {
    it('should generate support ticket response', async () => {
      const result = await service.generateReply(
        'SUPPORT',
        'Tengo un problema técnico',
        'tenant-123',
      );

      expect(result.content).toContain('Soporte');
      expect(result.content).toContain('Ticket');
    });
  });

  describe('Mock Reply - Internal Scope', () => {
    it('should respond to internal tagged messages', async () => {
      const result = await service.generateReply(
        'INTERNAL',
        '@ai ayúdame',
        'tenant-123',
      );

      expect(result.content).toContain('asistente');
    });
  });

  describe('Tenant Integration', () => {
    it('should fetch tenant for context', async () => {
      await service.generateReply('CUSTOMER', 'Hola', 'tenant-123');

      expect(tenantsService.findOne).toHaveBeenCalledWith('tenant-123');
    });

    it('should handle missing tenant gracefully', async () => {
      tenantsService.findOne.mockResolvedValueOnce(null as any);

      const result = await service.generateReply(
        'CUSTOMER',
        'Hola',
        'tenant-123',
      );

      expect(result.content).not.toBeNull();
    });
  });
});