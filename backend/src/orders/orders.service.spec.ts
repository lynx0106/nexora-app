import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { DataSource } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { PaymentsService } from '../payments/payments.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: jest.Mocked<any>;
  let productRepo: jest.Mocked<any>;
  let dataSource: jest.Mocked<DataSource>;
  let mailService: jest.Mocked<MailService>;
  let paymentsService: jest.Mocked<PaymentsService>;
  let chatGateway: jest.Mocked<ChatGateway>;
  let chatService: jest.Mocked<ChatService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    price: 50,
    stock: 10,
    tenantId: 'tenant-123',
  };

  const mockOrder = {
    id: 'order-123',
    tenantId: 'tenant-123',
    userId: 'user-123',
    status: 'pending',
    total: 100,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      findOne: jest.fn().mockResolvedValue(mockProduct),
      save: jest.fn().mockResolvedValue(mockOrder),
      create: jest.fn().mockReturnValue(mockOrder),
    },
  };

  beforeEach(async () => {
    const mockOrderRepo = {
      create: jest.fn().mockReturnValue(mockOrder),
      save: jest.fn().mockResolvedValue(mockOrder),
      find: jest.fn().mockResolvedValue([mockOrder]),
      findOne: jest.fn().mockResolvedValue(mockOrder),
      count: jest.fn().mockResolvedValue(5),
      remove: jest.fn().mockResolvedValue([mockOrder]),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
        getOne: jest.fn().mockResolvedValue(mockOrder),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockProductRepo = {
      findOne: jest.fn().mockResolvedValue(mockProduct),
      save: jest.fn().mockResolvedValue(mockProduct),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const mockMailService = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    const mockPaymentsService = {
      createPaymentLink: jest.fn().mockResolvedValue({ url: 'https://payment.link' }),
    };

    const mockChatGateway = {
      broadcastNewOrder: jest.fn().mockResolvedValue(undefined),
    };

    const mockChatService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    const mockNotificationsService = {
      createAndBroadcast: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: MailService, useValue: mockMailService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: ChatService, useValue: mockChatService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = module.get(getRepositoryToken(Order));
    productRepo = module.get(getRepositoryToken(Product));
    dataSource = module.get(DataSource);
    mailService = module.get(MailService);
    paymentsService = module.get(PaymentsService);
    chatGateway = module.get(ChatGateway);
    chatService = module.get(ChatService);
    notificationsService = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if no items provided', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [],
      };

      await expect(service.create(createData)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if quantity is zero or negative', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 0 }],
      };

      await expect(service.create(createData)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product not found', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'nonexistent', quantity: 2 }],
      };

      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createData)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 20 }],
      };

      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        ...mockProduct,
        stock: 5,
      });

      await expect(service.create(createData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByTenant', () => {
    it('should return all orders for a tenant', async () => {
      orderRepo.find.mockResolvedValue([mockOrder]);

      const result = await service.findAllByTenant('tenant-123');

      expect(result).toBeDefined();
      expect(orderRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        relations: ['items', 'items.product', 'user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findAllByTenantAndUser', () => {
    it('should return all orders for a tenant and user', async () => {
      orderRepo.find.mockResolvedValue([mockOrder]);

      const result = await service.findAllByTenantAndUser('tenant-123', 'user-123');

      expect(result).toBeDefined();
      expect(orderRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', userId: 'user-123' },
        relations: ['items', 'items.product', 'user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findRecent', () => {
    it('should return recent orders', async () => {
      orderRepo.find.mockResolvedValue([mockOrder]);

      const result = await service.findRecent('tenant-123', 10);

      expect(result).toBeDefined();
      expect(orderRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  describe('findAllGlobal', () => {
    it('should return all orders globally', async () => {
      orderRepo.find.mockResolvedValue([mockOrder]);

      const result = await service.findAllGlobal();

      expect(result).toBeDefined();
      expect(orderRepo.find).toHaveBeenCalled();
    });
  });

  describe('getDailySales', () => {
    it('should return daily sales for the last N days', async () => {
      const result = await service.getDailySales('tenant-123', 7);

      expect(result).toBeDefined();
    });
  });

  describe('getTopProducts', () => {
    it('should return top selling products', async () => {
      const result = await service.getTopProducts('tenant-123');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update order', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      orderRepo.save.mockResolvedValue({ ...mockOrder, status: 'completed' });

      const result = await service.update('order-123', { status: 'completed' });

      expect(result).toBeDefined();
    });

    it('should update payment status', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      orderRepo.save.mockResolvedValue({ ...mockOrder, paymentStatus: 'paid' });

      const result = await service.update('order-123', { paymentStatus: 'paid' });

      expect(result).toBeDefined();
    });

    it('should throw error if order not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { status: 'completed' })).rejects.toThrow('Order not found');
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-123');

      expect(result).toEqual(mockOrder);
      expect(orderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        relations: ['items', 'items.product', 'tenant'],
      });
    });
  });

  describe('remove', () => {
    it('should delete an order', async () => {
      orderRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('order-123');

      expect(result).toBeDefined();
      expect(orderRepo.delete).toHaveBeenCalledWith('order-123');
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      };
      orderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      orderRepo.count.mockResolvedValue(5);

      const result = await service.getDashboardStats('tenant-123');

      expect(result).toHaveProperty('todaySales');
      expect(result).toHaveProperty('todayCount');
      expect(result).toHaveProperty('pendingCount');
    });

    it('should return dashboard stats for specific user', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      };
      orderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      orderRepo.count.mockResolvedValue(3);

      const result = await service.getDashboardStats('tenant-123', 'user-123');

      expect(result).toHaveProperty('todaySales');
      expect(result).toHaveProperty('todayCount');
      expect(result).toHaveProperty('pendingCount');
    });
  });

  describe('findForReport', () => {
    it('should return orders for report', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      };
      orderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = await service.findForReport('tenant-123', start, end);

      expect(result).toBeDefined();
    });

    it('should filter by userId when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      };
      orderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = await service.findForReport('tenant-123', start, end, 'user-123');

      expect(result).toBeDefined();
    });
  });

  describe('removeAllByTenant', () => {
    it('should remove all orders for a tenant', async () => {
      orderRepo.find.mockResolvedValue([mockOrder]);
      orderRepo.remove.mockResolvedValue([mockOrder]);

      const result = await service.removeAllByTenant('tenant-123');

      expect(result).toEqual({ deleted: true, count: 1 });
    });

    it('should return count 0 if no orders found', async () => {
      orderRepo.find.mockResolvedValue([]);

      const result = await service.removeAllByTenant('tenant-123');

      expect(result).toEqual({ deleted: true, count: 0 });
    });
  });

  describe('create - success cases', () => {
    it('should create an order successfully with valid items', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 2 }],
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        paymentMethod: 'cash',
      };

      mockQueryRunner.manager.findOne.mockResolvedValue({
        ...mockProduct,
        stock: 10,
      });
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockOrder,
        id: 'new-order-id',
      });

      const result = await service.create(createData);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should decrease product stock when creating order', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 3 }],
      };

      const product = { ...mockProduct, stock: 10 };
      mockQueryRunner.manager.findOne.mockResolvedValue(product);
      mockQueryRunner.manager.save.mockImplementation(async (entity) => entity);

      await service.create(createData);

      // Stock should be decreased
      expect(product.stock).toBe(7);
    });

    it('should rollback transaction on error', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 2 }],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockProduct);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createData)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should create order with shipping address', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 1 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          zip: '10001',
          country: 'USA',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockProduct);
      mockQueryRunner.manager.save.mockResolvedValue(mockOrder);

      const result = await service.create(createData);

      expect(result).toBeDefined();
    });

    it('should create order with public access token', async () => {
      const createData = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 1 }],
        publicAccess: true,
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(mockProduct);
      mockQueryRunner.manager.save.mockResolvedValue(mockOrder);

      const result = await service.create(createData) as any;

      expect(result.publicToken).toBeDefined();
    });
  });

  describe('update - cancellation', () => {
    it('should restore stock when order is cancelled', async () => {
      const orderWithItems = {
        ...mockOrder,
        status: 'pending',
        items: [
          { productId: 'product-123', quantity: 2 },
          { productId: 'product-456', quantity: 1 },
        ],
      };

      orderRepo.findOne.mockResolvedValue(orderWithItems);
      
      const mockCancelQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          findOne: jest.fn().mockResolvedValue({ ...mockProduct, stock: 5 }),
          save: jest.fn().mockImplementation(async (entity) => entity),
        },
      };
      
      dataSource.createQueryRunner.mockReturnValue(mockCancelQueryRunner);

      const result = await service.update('order-123', { status: 'cancelled' });

      expect(mockCancelQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockCancelQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should not restore stock if order is already cancelled', async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: 'cancelled',
        items: [{ productId: 'product-123', quantity: 2 }],
      };

      orderRepo.findOne.mockResolvedValue(cancelledOrder);
      orderRepo.save.mockResolvedValue(cancelledOrder);

      const result = await service.update('order-123', { status: 'cancelled' });

      expect(result).toBeDefined();
    });
  });

  describe('getTopProducts with user filter', () => {
    it('should return top products filtered by user', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Product 1', total_quantity: '10' },
        ]),
      };
      orderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTopProducts('tenant-123', 'user-123');

      expect(result).toBeDefined();
    });
  });
});
