import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Repository<Product>;

  const mockProduct: Product = {
    id: 'product-uuid-1',
    name: 'Hamburguesa Clásica',
    description: 'Deliciosa hamburguesa con queso',
    price: 15000,
    stock: 50,
    isActive: true,
    imageUrl: 'https://example.com/burger.jpg',
    tenantId: 'tenant-uuid-1',
    duration: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  afterEach(() => {
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
    });
  });

  describe('findAllByTenant', () => {
    it('debería retornar todos los productos de un tenant', async () => {
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
    it('debería retornar un producto por ID', async () => {
      mockProductsRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-uuid-1', 'tenant-uuid-1');

      expect(result).toEqual(mockProduct);
    });

    it('debería lanzar error si el producto no existe', async () => {
      mockProductsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('noexistent', 'tenant-uuid-1'),
      ).rejects.toThrow('Product #noexistent not found');
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

      mockProductsRepository.create.mockReturnValue(mockProduct);
      mockProductsRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createData);

      expect(result).toEqual(mockProduct);
      expect(mockProductsRepository.create).toHaveBeenCalled();
      expect(mockProductsRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debería actualizar producto exitosamente', async () => {
      const updatedProduct = { ...mockProduct, name: 'Producto Actualizado' };
      mockProductsRepository.update.mockResolvedValue({ affected: 1, raw: [] });
      mockProductsRepository.findOne.mockResolvedValue(updatedProduct);

      const result = await service.update(
        'product-uuid-1',
        'tenant-uuid-1',
        { name: 'Producto Actualizado' },
      );

      expect(result.name).toBe('Producto Actualizado');
    });
  });

  describe('remove', () => {
    it('debería eliminar producto exitosamente', async () => {
      mockProductsRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.remove('product-uuid-1', 'tenant-uuid-1');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('updateAsAdmin', () => {
    it('debería actualizar producto como admin', async () => {
      const updatedProduct = { ...mockProduct, name: 'Producto Actualizado' };
      mockProductsRepository.update.mockResolvedValue({ affected: 1, raw: [] });
      mockProductsRepository.findOne.mockResolvedValue(updatedProduct);

      const result = await service.updateAsAdmin('product-uuid-1', { name: 'Producto Actualizado' });

      expect(result).toBeDefined();
    });
  });

  describe('removeAsAdmin', () => {
    it('debería eliminar producto como admin', async () => {
      mockProductsRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.removeAsAdmin('product-uuid-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
