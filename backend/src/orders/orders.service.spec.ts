import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const mockOrdersRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductsRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockMailService = {
    sendOrderConfirmation: jest.fn(),
  };

  const mockPaymentsService = {};

  const mockChatGateway = {};

  const mockChatService = {};

  const mockNotificationsService = {};

  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(
      mockOrdersRepository as any,
      mockProductsRepository as any,
      mockDataSource as any,
      mockMailService as any,
      mockPaymentsService as any,
      mockChatGateway as any,
      mockChatService as any,
      mockNotificationsService as any,
    );
  });

  describe('create', () => {
    it('debería crear una orden exitosamente', async () => {
      const orderData = {
        tenantId: 'tenant-1',
        customerEmail: 'cliente@test.com',
        customerName: 'Juan Perez',
        items: [
          { productId: 'prod-1', quantity: 2, price: 10000 },
          { productId: 'prod-2', quantity: 1, price: 5000 },
        ],
      };

      const mockProduct1 = { id: 'prod-1', name: 'Producto 1', stock: 10 };
      const mockProduct2 = { id: 'prod-2', name: 'Producto 2', stock: 5 };

      // Mock del queryRunner
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn()
            .mockResolvedValueOnce(mockProduct1)
            .mockResolvedValueOnce(mockProduct2),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      mockOrdersRepository.create.mockReturnValue({
        ...orderData,
        total: 25000,
      });
      mockOrdersRepository.save.mockResolvedValue({
        id: 'order-1',
        ...orderData,
        total: 25000,
        status: 'pending',
      });

      const result = await service.create(orderData);

      expect(result.total).toBe(25000);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('debería lanzar error si el producto no existe', async () => {
      const orderData = {
        tenantId: 'tenant-1',
        items: [{ productId: 'prod-inexistente', quantity: 1, price: 10000 }],
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(null),
        },
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      await expect(service.create(orderData)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debería lanzar error si stock insuficiente', async () => {
      const orderData = {
        tenantId: 'tenant-1',
        items: [{ productId: 'prod-1', quantity: 100, price: 10000 }],
      };

      const mockProduct = { id: 'prod-1', name: 'Producto', stock: 5 };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        },
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      await expect(service.create(orderData)).rejects.toThrow('Insufficient stock');
    });

    it('debería calcular el total correctamente', async () => {
      const orderData = {
        tenantId: 'tenant-1',
        items: [
          { productId: 'prod-1', quantity: 3, price: 10000 },
          { productId: 'prod-2', quantity: 2, price: 15000 },
        ],
      };

      const mockProduct1 = { id: 'prod-1', stock: 100 };
      const mockProduct2 = { id: 'prod-2', stock: 100 };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn()
            .mockResolvedValueOnce(mockProduct1)
            .mockResolvedValueOnce(mockProduct2),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      mockOrdersRepository.create.mockImplementation((data) => data);
      mockOrdersRepository.save.mockImplementation(async (data) => ({ id: 'order-1', ...data }));

      const result = await service.create(orderData);

      // Calcular total esperado
      // 3 * 10000 + 2 * 15000 = 30000 + 30000 = 60000
      expect(mockOrdersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ total: 60000 }),
      );
    });
  });

  describe('findOne', () => {
    it('debería retornar una orden por ID', async () => {
      const mockOrder = { id: 'order-1', tenantId: 'tenant-1', total: 25000 };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1');

      expect(result).toEqual(mockOrder);
      expect(mockOrdersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        relations: ['items', 'items.product', 'tenant'],
      });
    });

    it('debería retornar null si no existe', async () => {
      mockOrdersRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('inexistente');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debería actualizar una orden', async () => {
      const mockOrder = { id: 'order-1', status: 'pending' };
      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);
      mockOrdersRepository.save.mockResolvedValue({ ...mockOrder, status: 'completed' });

      const result = await service.update('order-1', { status: 'completed' });

      expect(result.status).toBe('completed');
      expect(mockOrdersRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debería eliminar una orden', async () => {
      mockOrdersRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('order-1');

      expect(mockOrdersRepository.delete).toHaveBeenCalledWith('order-1');
    });
  });
});
