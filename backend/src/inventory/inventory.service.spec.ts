import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let orderItemRepo: jest.Mocked<Repository<OrderItem>>;

  const mockTenantId = 'tenant-123';

  const mockProduct: Product = {
    id: 'product-1',
    tenantId: mockTenantId,
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    cost: 60,
    stock: 10,
    minStock: 5,
    duration: undefined as unknown as number,
    imageUrl: undefined as unknown as string,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLowStockProduct: Product = {
    id: 'product-2',
    tenantId: mockTenantId,
    name: 'Low Stock Product',
    description: 'Low Stock',
    price: 50,
    cost: 30,
    stock: 2,
    minStock: 5,
    duration: undefined as unknown as number,
    imageUrl: undefined as unknown as string,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockQueryBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productRepo = module.get(getRepositoryToken(Product));
    orderRepo = module.get(getRepositoryToken(Order));
    orderItemRepo = module.get(getRepositoryToken(OrderItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return inventory dashboard with correct metrics', async () => {
      productRepo.find.mockResolvedValue([mockProduct, mockLowStockProduct]);

      const result = await service.getDashboard(mockTenantId);

      expect(result.totalProducts).toBe(2);
      expect(result.totalInventoryValue).toBe(100 * 10 + 50 * 2);
      expect(result.totalCostValue).toBe(60 * 10 + 30 * 2);
      expect(result.potentialProfit).toBe(1100 - 660);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with stock below minimum', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([mockLowStockProduct]);
      productRepo.createQueryBuilder = jest.fn(() => mockQueryBuilder as any);

      const result = await service.getLowStockProducts(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Low Stock Product');
      expect(result[0].stock).toBe(2);
      expect(result[0].minStock).toBe(5);
      expect(result[0].deficit).toBe(3);
    });
  });

  describe('getTopProfitableProducts', () => {
    it('should return most profitable products with margin calculations', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          productId: 'product-1',
          productName: 'Test Product',
          price: 100,
          cost: 60,
          totalSold: '10',
          totalRevenue: '1000',
        },
      ]);
      orderItemRepo.createQueryBuilder = jest.fn(() => mockQueryBuilder as any);

      const result = await service.getTopProfitableProducts(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product');
      expect(result[0].margin).toBe(40);
      expect(result[0].marginPercentage).toBe(40);
      expect(result[0].totalSold).toBe(10);
      expect(result[0].totalProfit).toBe(400);
    });
  });

  describe('getInventoryValuation', () => {
    it('should return full inventory valuation with totals', async () => {
      productRepo.find.mockResolvedValue([mockProduct, mockLowStockProduct]);

      const result = await service.getInventoryValuation(mockTenantId);

      expect(result.valuation).toHaveLength(2);
      expect(result.totals.totalProducts).toBe(2);
      expect(result.totals.totalStock).toBe(12);
      expect(result.totals.totalInventoryValue).toBe(1100);
      expect(result.totals.totalCostValue).toBe(660);
      expect(result.totals.totalPotentialProfit).toBe(440);
    });
  });

  describe('updateProductCost', () => {
    it('should update product cost and minStock', async () => {
      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue({
        ...mockProduct,
        cost: 70,
        minStock: 8,
      });

      const result = await service.updateProductCost(
        mockTenantId,
        'product-1',
        70,
        8,
      );

      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1', tenantId: mockTenantId },
      });
      expect(productRepo.save).toHaveBeenCalled();
      expect(result.cost).toBe(70);
      expect(result.minStock).toBe(8);
    });

    it('should throw error if product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProductCost(mockTenantId, 'non-existent', 50),
      ).rejects.toThrow('Product not found');
    });
  });
});
