import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async uploadProducts(fileBuffer: Buffer, tenantId: string) {
    const results: any[] = [];
    const stream = Readable.from(fileBuffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            let count = 0;
            for (const row of results) {
              if (!row.name || !row.price) continue; // Skip invalid rows

              const productData = {
                name: row.name.trim(),
                description: row.description || '',
                price: parseFloat(row.price),
                stock: row.stock ? parseInt(row.stock, 10) : 0,
                duration: row.duration ? parseInt(row.duration, 10) : undefined,
                imageUrl: row.imageUrl || undefined,
                tenantId,
                isActive: true,
              };

              const existing = await this.productsRepository.findOne({
                where: { name: productData.name, tenantId },
              });

              if (existing) {
                await this.productsRepository.update(
                  { id: existing.id },
                  productData,
                );
              } else {
                await this.productsRepository.save(
                  this.productsRepository.create(productData),
                );
              }
              count++;
            }
            resolve({ message: `Procesados ${count} productos correctamente` });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => reject(error));
    });
  }

  async create(data: Partial<Product>) {
    const product = this.productsRepository.create(data);
    return this.productsRepository.save(product);
  }

  findAll() {
    return this.productsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findAllByTenant(tenantId: string) {
    return this.productsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.productsRepository.findOne({
      where: { id, tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async update(id: string, tenantId: string, data: Partial<Product>) {
    await this.productsRepository.update({ id, tenantId }, data);
    return this.findOne(id, tenantId);
  }

  async updateAsAdmin(id: string, data: Partial<Product>) {
    await this.productsRepository.update({ id }, data);
    return this.productsRepository.findOne({ where: { id } });
  }

  async remove(id: string, tenantId: string) {
    await this.productsRepository.delete({ id, tenantId });
    return { deleted: true };
  }

  async removeAsAdmin(id: string) {
    await this.productsRepository.delete({ id });
    return { deleted: true };
  }

  async seedProducts(tenantId: string) {
    let products: any[] = [];

    if (tenantId === 'belleza-plus') {
      products = [
        {
          name: 'Tratamiento Facial Profundo',
          description: 'Limpieza profunda de poros y mascarilla hidratante.',
          price: 45.0,
          duration: 60,
          tenantId,
        },
        {
          name: 'Depilación Láser Piernas',
          description:
            'Sesión de depilación láser diodo para piernas completas.',
          price: 120.0,
          duration: 45,
          tenantId,
        },
        {
          name: 'Maquillaje Profesional',
          description: 'Maquillaje para eventos especiales con productos HD.',
          price: 55.0,
          duration: 60,
          tenantId,
        },
        {
          name: 'Peinado de Novia',
          description: 'Prueba y peinado final para bodas.',
          price: 150.0,
          duration: 120,
          tenantId,
        },
        {
          name: 'Masaje Piedras Calientes',
          description: 'Terapia relajante con piedras volcánicas.',
          price: 75.0,
          duration: 75,
          tenantId,
        },
      ];
    } else if (tenantId === 'clinica-dental-vital') {
      products = [
        {
          name: 'Limpieza Dental Ultrasónica',
          description: 'Eliminación de sarro y pulido dental completo.',
          price: 60.0,
          duration: 45,
          tenantId,
        },
        {
          name: 'Blanqueamiento Zoom',
          description: 'Blanqueamiento profesional en una sola sesión.',
          price: 250.0,
          duration: 90,
          tenantId,
        },
        {
          name: 'Consulta de Ortodoncia',
          description: 'Evaluación inicial y plan de tratamiento.',
          price: 40.0,
          duration: 30,
          tenantId,
        },
        {
          name: 'Extracción Simple',
          description: 'Extracción de pieza dental sin cirugía.',
          price: 80.0,
          duration: 45,
          tenantId,
        },
        {
          name: 'Implante Dental (Fase 1)',
          description: 'Colocación del implante de titanio.',
          price: 800.0,
          duration: 120,
          tenantId,
        },
      ];
    } else if (tenantId === 'abastos-la-frescura') {
      products = [
        {
          name: 'Manzanas Golden (kg)',
          description: 'Manzanas frescas de temporada.',
          price: 2.5,
          tenantId,
        },
        {
          name: 'Pan Artesanal',
          description: 'Hogaza de masa madre.',
          price: 3.2,
          tenantId,
        },
        {
          name: 'Leche Entera 1L',
          description: 'Leche fresca de granja.',
          price: 1.1,
          tenantId,
        },
        {
          name: 'Huevos Camperos (12u)',
          description: 'Huevos de gallinas en libertad.',
          price: 4.5,
          tenantId,
        },
        {
          name: 'Queso Manchego Curado',
          description: 'Cuña de 250g.',
          price: 6.8,
          tenantId,
        },
      ];
    } else if (tenantId === 'moda-urbana') {
      products = [
        {
          name: 'Camiseta Básica Algodón',
          description: '100% algodón orgánico.',
          price: 15.99,
          tenantId,
        },
        {
          name: 'Jeans Slim Fit',
          description: 'Vaqueros elásticos cómodos.',
          price: 39.99,
          tenantId,
        },
        {
          name: 'Zapatillas Urbanas',
          description: 'Sneakers casuales.',
          price: 59.9,
          tenantId,
        },
        {
          name: 'Sudadera con Capucha',
          description: 'Felpa suave interior.',
          price: 29.99,
          tenantId,
        },
        {
          name: 'Gorra Snapback',
          description: 'Estilo urbano ajustable.',
          price: 19.9,
          tenantId,
        },
      ];
    } else if (tenantId === 'pet-friends') {
      products = [
        // Services
        {
          name: 'Baño y Corte Canino',
          description: 'Servicio completo de peluquería.',
          price: 35.0,
          duration: 60,
          tenantId,
        },
        {
          name: 'Consulta Veterinaria',
          description: 'Revisión general de salud.',
          price: 45.0,
          duration: 30,
          tenantId,
        },
        // Products
        {
          name: 'Pienso Premium Perros 10kg',
          description: 'Alimento balanceado alta gama.',
          price: 55.0,
          tenantId,
        },
        {
          name: 'Juguete Mordedor',
          description: 'Resistente y seguro.',
          price: 12.5,
          tenantId,
        },
        {
          name: 'Collar Antiparasitario',
          description: 'Protección 8 meses.',
          price: 28.9,
          tenantId,
        },
      ];
    } else if (tenantId === 'tech-master') {
      products = [
        // Services
        {
          name: 'Reparación Pantalla Móvil',
          description: 'Sustitución de display.',
          price: 80.0,
          duration: 60,
          tenantId,
        },
        {
          name: 'Limpieza Virus PC',
          description: 'Optimización y limpieza software.',
          price: 45.0,
          duration: 90,
          tenantId,
        },
        // Products
        {
          name: 'Cable USB-C Carga Rápida',
          description: '2 metros, reforzado.',
          price: 14.99,
          tenantId,
        },
        {
          name: 'Auriculares Bluetooth',
          description: 'Cancelación de ruido.',
          price: 89.9,
          tenantId,
        },
        {
          name: 'Funda Tablet Universal',
          description: 'Protección antigolpes.',
          price: 19.99,
          tenantId,
        },
      ];
    } else {
      // Default products (fallback)
      products = [
        {
          name: 'Producto de Ejemplo',
          description: 'Descripción del producto.',
          price: 25.0,
          tenantId,
        },
        {
          name: 'Servicio de Ejemplo',
          description: 'Descripción del servicio.',
          price: 50.0,
          duration: 60,
          tenantId,
        },
      ];
    }

    const createdProducts: Product[] = [];
    for (const p of products) {
      const product = this.productsRepository.create(p as unknown as Product);
      createdProducts.push(await this.productsRepository.save(product));
    }
    return createdProducts;
  }
}
