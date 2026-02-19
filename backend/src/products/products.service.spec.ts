import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: jest.Mocked<Repository<Product>>;

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    stock: 10,
    tenantId: 'tenant-123',
    categoryId: 'category-123',
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProductRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
        getOne: jest.fn().mockResolvedValue(mockProduct),
        getCount: jest.fn().mockResolvedValue(1),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createData = {
        name: 'New Product',
        description: 'New Description',
        price: 50,
        stock: 20,
        tenantId: 'tenant-123',
      };

      productRepo.create.mockReturnValue(mockProduct as any);
      productRepo.save.mockResolvedValue(mockProduct as any);

      const result = await service.create(createData);

      expect(result).toBeDefined();
      expect(productRepo.create).toHaveBeenCalledWith(createData);
      expect(productRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      productRepo.find.mockResolvedValue([mockProduct] as any);

      const result = await service.findAll();

      expect(result).toEqual([mockProduct]);
      expect(productRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findAllByTenant', () => {
    it('should return all products for a tenant', async () => {
      productRepo.find.mockResolvedValue([mockProduct] as any);

      const result = await service.findAllByTenant('tenant-123');

      expect(result).toEqual([mockProduct]);
      expect(productRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id and tenantId', async () => {
      productRepo.findOne.mockResolvedValue(mockProduct as any);

      const result = await service.findOne('product-123', 'tenant-123');

      expect(result).toEqual(mockProduct);
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'product-123', tenantId: 'tenant-123' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateData = { name: 'Updated Product', price: 150 };
      const updatedProduct = { ...mockProduct, ...updateData };

      productRepo.update.mockResolvedValue({ affected: 1 } as any);
      productRepo.findOne.mockResolvedValue(updatedProduct as any);

      const result = await service.update('product-123', 'tenant-123', updateData);

      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(150);
      expect(productRepo.update).toHaveBeenCalledWith(
        { id: 'product-123', tenantId: 'tenant-123' },
        updateData,
      );
    });
  });

  describe('updateAsAdmin', () => {
    it('should update a product as admin', async () => {
      const updateData = { name: 'Admin Updated' };
      const updatedProduct = { ...mockProduct, ...updateData };

      productRepo.update.mockResolvedValue({ affected: 1 } as any);
      productRepo.findOne.mockResolvedValue(updatedProduct as any);

      const result = await service.updateAsAdmin('product-123', updateData);

      expect(result.name).toBe('Admin Updated');
      expect(productRepo.update).toHaveBeenCalledWith({ id: 'product-123' }, updateData);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      productRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove('product-123', 'tenant-123');

      expect(result).toEqual({ deleted: true });
      expect(productRepo.delete).toHaveBeenCalledWith({
        id: 'product-123',
        tenantId: 'tenant-123',
      });
    });
  });

  describe('removeAsAdmin', () => {
    it('should delete a product as admin', async () => {
      productRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.removeAsAdmin('product-123');

      expect(result).toEqual({ deleted: true });
      expect(productRepo.delete).toHaveBeenCalledWith({ id: 'product-123' });
    });
  });

  describe('uploadProducts', () => {
    it('should upload new products from CSV', async () => {
      const csvBuffer = Buffer.from('name,price,description,stock\nProduct 1,100,Desc 1,10\nProduct 2,200,Desc 2,20');

      productRepo.findOne.mockResolvedValue(null);
      productRepo.create.mockReturnValue({} as any);
      productRepo.save.mockResolvedValue({ id: 'new-product' } as any);

      const result = await service.uploadProducts(csvBuffer, 'tenant-123');

      expect(result).toEqual({ message: 'Procesados 2 productos correctamente' });
    });

    it('should update existing products from CSV', async () => {
      const csvBuffer = Buffer.from('name,price\nTest Product,150');

      productRepo.findOne.mockResolvedValue(mockProduct as any);
      productRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.uploadProducts(csvBuffer, 'tenant-123');

      expect(result).toEqual({ message: 'Procesados 1 productos correctamente' });
      expect(productRepo.update).toHaveBeenCalled();
    });

    it('should skip rows without name or price', async () => {
      const csvBuffer = Buffer.from('name,price\n,100\nProduct 2,');

      productRepo.findOne.mockResolvedValue(null);
      productRepo.create.mockReturnValue({} as any);
      productRepo.save.mockResolvedValue({} as any);

      const result = await service.uploadProducts(csvBuffer, 'tenant-123');

      expect(result).toEqual({ message: 'Procesados 0 productos correctamente' });
    });

    it('should parse duration and imageUrl from CSV', async () => {
      const csvBuffer = Buffer.from('name,price,duration,imageUrl\nService,100,60,https://example.com/img.jpg');

      productRepo.findOne.mockResolvedValue(null);
      productRepo.create.mockReturnValue({} as any);
      productRepo.save.mockResolvedValue({} as any);

      await service.uploadProducts(csvBuffer, 'tenant-123');

      expect(productRepo.save).toHaveBeenCalled();
    });
  });

  describe('seedProducts', () => {
    it('should seed belleza-plus products', async () => {
      productRepo.create.mockImplementation((p) => p as any);
      productRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'generated-id' } as any));

      const result = await service.seedProducts('belleza-plus');

      expect(result.length).toBe(5);
      expect(result[0].name).toBe('Tratamiento Facial Profundo');
    });

    it('should seed clinica-dental-vital products', async () => {
      productRepo.create.mockImplementation((p) => p as any);
      productRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'generated-id' } as any));

      const result = await service.seedProducts('clinica-dental-vital');

      expect(result.length).toBe(5);
      expect(result[0].name).toBe('Limpieza Dental Ultrasónica');
    });

    it('should seed abastos-la-frescura products', async () => {
      productRepo.create.mockImplementation((p) => p as any);
      productRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'generated-id' } as any));

      const result = await service.seedProducts('abastos-la-frescura');

      expect(result.length).toBe(5);
      expect(result[0].name).toBe('Manzanas Golden (kg)');
    });

    it('should seed moda-urbana products', async () => {
      productRepo.create.mockImplementation((p) => p as any);
      productRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'generated-id' } as any));

      const result = await service.seedProducts('moda-urbana');

      expect(result.length).toBe(5);
      expect(result[0].name).toBe('Camiseta Básica Algodón');
    });

    it('should seed pet-friends products', async () => {
      productRepo.create.mockImplementation((p) => p as any);
      productRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'generated-id' } as any));

      const result = await service.seedProducts('pet-friends');

      expect(result.length).toBe(5);
      expect(result[0].name).toBe('Baño y Corte Canino');
    });

    it('should seed tech-master products', async () => {
      productRepo.create.mockImplementation((p) => p as any);
      productRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'generated-id' } as any));

      const result = await service.seedProducts('tech-master');

      expect(result.length).toBe(5);
      expect(result[0].name).toBe('Reparación Pantalla Móvil');
    });

    it('should seed default products for unknown tenant', async () => {
      productRepo.create.mockImplementation((p) => p as any);
      productRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'generated-id' } as any));

      const result = await service.seedProducts('unknown-tenant');

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Producto de Ejemplo');
    });
  });
});
