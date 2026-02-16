import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Repository<Product>;
  let tenantsRepository: Repository<Tenant>;

  const mockProduct: Product = {
    id: 'product-uuid-1',
    name: 'Hamburguesa Clásica',
    description: 'Deliciosa hamburguesa con queso',
    price: 15000,
    stock: 50,
    isActive: true,
    imageUrl: 'https://example.com/burger.jpg',
    tenantId: 'tenant-uuid-1',
    category: 'Comidas',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  const mockTenantsRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantsRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    tenantsRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar todos los productos', async () => {
      const products = [mockProduct];
      mockProductsRepository.find.mockResolvedValue(products);

      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(mockProductsRepository.find).toHaveBeenCalled();
    });
  });

  describe('findAllByTenant', () => {
    it('debería retornar productos del tenant', async () => {
      const products = [mockProduct];
      mockProductsRepository.find.mockResolvedValue(products);

      const result = await service.findAllByTenant('tenant-uuid-1');

      expect(result).toEqual(products);
      expect(mockProductsRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('debería encontrar producto por ID', async () => {
      mockProductsRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-uuid-1', 'tenant-uuid-1');

      expect(result).toEqual(mockProduct);
    });

    it('debería lanzar error si el producto no existe', async () => {
      mockProductsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('noexistent', 'tenant-uuid-1'),
      ).rejects.toThrow('Producto no encontrado');
    });

    it('debería lanzar error si el producto no pertenece al tenant', async () => {
      mockProductsRepository.findOne.mockResolvedValue(mockProduct);

      await expect(
        service.findOne('product-uuid-1', 'otro-tenant'),
      ).rejects.toThrow('No tienes permiso para ver este producto');
    });
  });

  describe('create', () => {
    it('debería crear producto exitosamente', async () => {
      const createData = {
        name: 'Nuevo Producto',
        description: 'Descripción del producto',
        price: 20000,
        stock: 100,
        tenantId: 'tenant-uuid-1',
      };

      mockProductsRepository.create.mockReturnValue({ ...mockProduct, ...createData });
      mockProductsRepository.save.mockResolvedValue({ ...mockProduct, ...createData });

      const result = await service.create(createData);

      expect(result.name).toBe('Nuevo Producto');
      expect(mockProductsRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar error si faltan datos requeridos', async () => {
      await expect(
        service.create({
          name: '',
          price: 0,
          tenantId: 'tenant-uuid-1',
        }),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('debería actualizar producto exitosamente', async () => {
      const updatedProduct = { ...mockProduct, name: 'Producto Actualizado' };
      mockProductsRepository.findOne.mockResolvedValue(mockProduct);
      mockProductsRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(
        'product-uuid-1',
        'tenant-uuid-1',
        { name: 'Producto Actualizado' },
      );

      expect(result.name).toBe('Producto Actualizado');
    });

    it('debería lanzar error si el producto no existe', async () => {
      mockProductsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('noexistent', 'tenant-uuid-1', { name: 'Updated' }),
      ).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('remove', () => {
    it('debería eliminar producto exitosamente', async () => {
      mockProductsRepository.findOne.mockResolvedValue(mockProduct);
      mockProductsRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(
        service.remove('product-uuid-1', 'tenant-uuid-1'),
      ).resolves.not.toThrow();
    });

    it('debería lanzar error si el producto no existe', async () => {
      mockProductsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('noexistent', 'tenant-uuid-1'),
      ).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('updateStock', () => {
    it('debería actualizar stock exitosamente', async () => {
      const updatedProduct = { ...mockProduct, stock: 45 };
      mockProductsRepository.findOne.mockResolvedValue(mockProduct);
      mockProductsRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.updateStock('product-uuid-1', 'tenant-uuid-1', 45);

      expect(result.stock).toBe(45);
    });

    it('debería lanzar error si el stock es negativo', async () => {
      mockProductsRepository.findOne.mockResolvedValue(mockProduct);

      await expect(
        service.updateStock('product-uuid-1', 'tenant-uuid-1', -10),
      ).rejects.toThrow('El stock no puede ser negativo');
    });
  });

  describe('search', () => {
    it('debería buscar productos por nombre', async () => {
      const products = [mockProduct];
      mockProductsRepository.createQueryBuilder().getMany.mockResolvedValue(products);

      const result = await service.search('Hamburguesa', 'tenant-uuid-1');

      expect(result).toEqual(products);
    });
  });
});
