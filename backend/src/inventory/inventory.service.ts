import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

export interface InventoryDashboard {
  totalProducts: number;
  totalInventoryValue: number;
  totalCostValue: number;
  potentialProfit: number;
  averageMargin: number;
  lowStockProducts: LowStockProduct[];
  topProfitableProducts: ProfitableProduct[];
  recentMovements: StockMovement[];
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  deficit: number;
  price: number;
  cost: number;
}

export interface ProfitableProduct {
  id: string;
  name: string;
  price: number;
  cost: number;
  margin: number;
  marginPercentage: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface StockMovement {
  id: string;
  type: 'sale' | 'cancellation' | 'restock';
  productName: string;
  quantity: number;
  date: Date;
  orderId?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async getDashboard(tenantId: string): Promise<InventoryDashboard> {
    // Get all active products for the tenant
    const products = await this.productsRepository.find({
      where: { tenantId, isActive: true },
    });

    // Calculate inventory values
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
      0,
    );
    const totalCostValue = products.reduce(
      (sum, p) => sum + Number(p.cost || 0) * Number(p.stock || 0),
      0,
    );
    const potentialProfit = totalInventoryValue - totalCostValue;

    // Calculate average margin
    const productsWithPrice = products.filter(
      (p) => Number(p.price || 0) > 0,
    );
    const averageMargin =
      productsWithPrice.length > 0
        ? productsWithPrice.reduce((sum, p) => {
            const price = Number(p.price || 0);
            const cost = Number(p.cost || 0);
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
            return sum + margin;
          }, 0) / productsWithPrice.length
        : 0;

    // Get low stock products
    const lowStockProducts = await this.getLowStockProducts(tenantId);

    // Get top profitable products
    const topProfitableProducts = await this.getTopProfitableProducts(tenantId);

    // Get recent stock movements
    const recentMovements = await this.getRecentStockMovements(tenantId);

    return {
      totalProducts,
      totalInventoryValue,
      totalCostValue,
      potentialProfit,
      averageMargin,
      lowStockProducts,
      topProfitableProducts,
      recentMovements,
    };
  }

  async getLowStockProducts(tenantId: string): Promise<LowStockProduct[]> {
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.stock <= product.minStock')
      .orderBy('product.stock', 'ASC')
      .limit(10)
      .getMany();

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: Number(p.stock || 0),
      minStock: Number(p.minStock || 0),
      deficit: Number(p.minStock || 0) - Number(p.stock || 0),
      price: Number(p.price || 0),
      cost: Number(p.cost || 0),
    }));
  }

  async getTopProfitableProducts(
    tenantId: string,
    limit: number = 5,
  ): Promise<ProfitableProduct[]> {
    // Get sold items with product details
    const soldItems = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoin('item.product', 'product')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.status != :cancelledStatus', {
        cancelledStatus: 'cancelled',
      })
      .select([
        'product.id AS "productId"',
        'product.name AS "productName"',
        'product.price AS "price"',
        'product.cost AS "cost"',
        'SUM(item.quantity) AS "totalSold"',
        'SUM(item.quantity * item.price) AS "totalRevenue"',
      ])
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.price')
      .addGroupBy('product.cost')
      .orderBy('"totalRevenue"', 'DESC')
      .limit(limit)
      .getRawMany();

    return soldItems.map((item) => {
      const price = Number(item.price || 0);
      const cost = Number(item.cost || 0);
      const totalSold = Number(item.totalSold || 0);
      const totalRevenue = Number(item.totalRevenue || 0);
      const margin = price - cost;
      const marginPercentage = price > 0 ? ((price - cost) / price) * 100 : 0;
      const totalProfit = totalSold * margin;

      return {
        id: item.productId,
        name: item.productName,
        price,
        cost,
        margin,
        marginPercentage,
        totalSold,
        totalRevenue,
        totalProfit,
      };
    });
  }

  async getRecentStockMovements(
    tenantId: string,
    limit: number = 10,
  ): Promise<StockMovement[]> {
    // Get recent orders (sales and cancellations)
    const recentOrders = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .where('order.tenantId = :tenantId', { tenantId })
      .orderBy('order.updatedAt', 'DESC')
      .limit(limit)
      .getMany();

    const movements: StockMovement[] = [];

    for (const order of recentOrders) {
      for (const item of order.items) {
        if (item.product) {
          movements.push({
            id: `${order.id}-${item.id}`,
            type: order.status === 'cancelled' ? 'cancellation' : 'sale',
            productName: item.product.name,
            quantity: item.quantity,
            date: order.updatedAt || order.createdAt,
            orderId: order.id,
          });
        }
      }
    }

    return movements.slice(0, limit);
  }

  async getInventoryValuation(tenantId: string) {
    const products = await this.productsRepository.find({
      where: { tenantId, isActive: true },
    });

    const valuation = products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: Number(p.stock || 0),
      price: Number(p.price || 0),
      cost: Number(p.cost || 0),
      inventoryValue: Number(p.price || 0) * Number(p.stock || 0),
      costValue: Number(p.cost || 0) * Number(p.stock || 0),
      potentialProfit:
        (Number(p.price || 0) - Number(p.cost || 0)) * Number(p.stock || 0),
      marginPercentage:
        Number(p.price || 0) > 0
          ? ((Number(p.price || 0) - Number(p.cost || 0)) /
              Number(p.price || 0)) *
            100
          : 0,
    }));

    const totals = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + Number(p.stock || 0), 0),
      totalInventoryValue: valuation.reduce(
        (sum, v) => sum + v.inventoryValue,
        0,
      ),
      totalCostValue: valuation.reduce((sum, v) => sum + v.costValue, 0),
      totalPotentialProfit: valuation.reduce(
        (sum, v) => sum + v.potentialProfit,
        0,
      ),
    };

    return { valuation, totals };
  }

  async updateProductCost(
    tenantId: string,
    productId: string,
    cost: number,
    minStock?: number,
  ) {
    const product = await this.productsRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.cost = cost;
    if (minStock !== undefined) {
      product.minStock = minStock;
    }

    return this.productsRepository.save(product);
  }
}
