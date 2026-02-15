import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { MailService } from '../mail/mail.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { PaymentsService } from '../payments/payments.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
    private mailService: MailService,
    private paymentsService: PaymentsService,
    private chatGateway: ChatGateway,
    private chatService: ChatService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: {
    tenantId: string;
    userId?: string;
    items: { productId: string; quantity: number; price: number }[];
    shippingAddress?: {
      street?: string;
      city?: string;
      zip?: string;
      country?: string;
      firstName?: string;
      lastName?: string;
    };
    customerEmail?: string;
    customerName?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!data.items || data.items.length === 0) {
        throw new BadRequestException('El pedido debe incluir al menos un item');
      }

      let total = 0;
      const orderItems: { productId: string; quantity: number; price: number }[] = [];

      // Decrease stock
      for (const item of data.items) {
        if (item.quantity <= 0) {
          throw new BadRequestException('La cantidad debe ser mayor a cero');
        }

        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' }, // Lock row to prevent race conditions
        });

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}`,
          );
        }

        const unitPrice = Number(product.price || 0);
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: unitPrice,
        });
        total += unitPrice * item.quantity;

        product.stock -= item.quantity;
        await queryRunner.manager.save(product);
      }

      const order = this.ordersRepository.create({
        tenantId: data.tenantId,
        userId: data.userId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        total,
        status: 'pending', // Default to pending
        paymentStatus: data.paymentStatus || 'pending',
        paymentMethod: data.paymentMethod || 'cash',
        items: orderItems,
        shippingAddress: data.shippingAddress,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      // Post-creation logic (Payments, Emails, Notifications) - Wrapped to prevent crashes
      let finalOrder = savedOrder;
      try {
        const tenant = await this.dataSource.manager.findOne(Tenant, {
          where: { id: data.tenantId },
        });

        if (tenant) {
          // 1. Generate Payment Link (if applicable)
          if (
            savedOrder.paymentStatus === 'pending' &&
            savedOrder.paymentMethod !== 'cash'
          ) {
            try {
              const preference = await this.paymentsService.createPreference(
                savedOrder,
                tenant,
              );
              if (preference) {
                savedOrder.preferenceId = preference.preferenceId || '';
                savedOrder.paymentLink = preference.initPoint || '';

                finalOrder = await this.ordersRepository.save(savedOrder);

                // --- AI/CHAT INTEGRATION ---
                if (finalOrder.userId) {
                  const messageContent = `👋 ¡Hola! Se ha generado tu pedido #${finalOrder.id.slice(0, 8)} por un total de ${finalOrder.total}. 
                  
  Puedes realizar el pago seguro aquí: ${finalOrder.paymentLink}
                  
  Cualquier duda, estoy aquí para ayudarte.`;

                  const chatMsg = await this.chatService.createMessage(
                    messageContent,
                    null,
                    tenant.id,
                    'CUSTOMER',
                    finalOrder.userId,
                    true,
                  );

                  this.chatGateway.server
                    .to(`tenant-${tenant.id}-customer-${finalOrder.userId}`)
                    .emit('newMessage', chatMsg);
                  this.chatGateway.server
                    .to(`tenant-${tenant.id}-customers-all`)
                    .emit('newMessage', chatMsg);
                }
              }
            } catch (error) {
              console.error(
                '⚠️ Failed to generate payment link or chat msg:',
                error,
              );
            }
          }

          // 2. Send Notification to Admins
          try {
            this.notificationsService
              .createAndBroadcast({
                tenantId: data.tenantId,
                title: 'Nuevo Pedido',
                message: `Se ha recibido un nuevo pedido (#${finalOrder.id.slice(0, 8)}) por ${finalOrder.total}.`,
                type: 'success',
                link: `/dashboard/orders`,
              })
              .catch((err) =>
                console.error('⚠️ Failed to send notification (promise):', err),
              );
          } catch (error) {
            console.error('⚠️ Failed to initiate notification:', error);
          }

          // 3. Send Email Notification
          if (data.customerEmail) {
            try {
              const customerName = data.shippingAddress?.firstName
                ? `${data.shippingAddress.firstName} ${data.shippingAddress.lastName || ''}`
                : 'Cliente';

              const fullOrder = await this.ordersRepository.findOne({
                where: { id: finalOrder.id },
                relations: ['items', 'items.product'],
              });

              if (fullOrder) {
                this.mailService
                  .sendOrderConfirmation(
                    {
                      ...fullOrder,
                      customerName,
                      customerEmail: data.customerEmail,
                    } as any,
                    tenant,
                  )
                  .catch((err) =>
                    console.error('⚠️ Failed to send email (promise):', err),
                  );
              }
            } catch (error) {
              console.error('⚠️ Failed to initiate email:', error);
            }
          }
        }
      } catch (postProcessError) {
        console.error(
          '❌ Critical Error in Order Post-Processing:',
          postProcessError,
        );
        // Do not throw, return the order anyway
      }

      return finalOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAllByTenant(tenantId: string) {
    return this.ordersRepository.find({
      where: { tenantId },
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  findAllByTenantAndUser(tenantId: string, userId: string) {
    return this.ordersRepository.find({
      where: { tenantId, userId },
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  findRecent(tenantId: string, limit: number, userId?: string) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;

    return this.ordersRepository.find({
      where,
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  findAllGlobal() {
    return this.ordersRepository.find({
      relations: ['items', 'items.product', 'tenant'], // Add user relation if needed, but tenant is key for superadmin
      order: { createdAt: 'DESC' },
    });
  }

  async getDailySales(tenantId: string, days: number) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);

    const orders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.createdAt >= :fromDate', { fromDate })
      .andWhere("order.status != 'cancelled'")
      .select(['order.createdAt', 'order.total'])
      .orderBy('order.createdAt', 'ASC')
      .getMany();

    return orders;
  }

  async getTopProducts(tenantId: string, userId?: string) {
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .leftJoin('item.product', 'product')
      .where('order.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('order.userId = :userId', { userId });
    }

    return query
      .select([
        'product.id AS "id"',
        'product.name AS "name"',
        'product.price AS "price"',
        'product.imageUrl AS "imageUrl"',
        'SUM(item.quantity) AS "total_quantity"',
      ])
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.price')
      .addGroupBy('product.imageUrl')
      .orderBy('total_quantity', 'DESC')
      .limit(5)
      .getRawMany();
  }

  async update(
    id: string,
    updateData: {
      status?: string;
      paymentStatus?: string;
      paymentMethod?: string;
    },
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new Error('Order not found');
    }

    // Logic for restoring stock if order is cancelled
    if (updateData.status === 'cancelled' && order.status !== 'cancelled') {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        for (const item of order.items) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: item.productId },
          });
          if (product) {
            product.stock += item.quantity;
            await queryRunner.manager.save(product);
          }
        }
        order.status = 'cancelled';
        await queryRunner.manager.save(Order, order);
        await queryRunner.commitTransaction();
        return order;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    if (updateData.status) {
      order.status = updateData.status;
    }
    if (updateData.paymentStatus) {
      order.paymentStatus = updateData.paymentStatus;
    }
    if (updateData.paymentMethod) {
      order.paymentMethod = updateData.paymentMethod;
    }
    return this.ordersRepository.save(order);
  }

  async remove(id: string) {
    return this.ordersRepository.delete(id);
  }

  async findOne(id: string) {
    return this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'tenant'],
    });
  }

  async getDashboardStats(tenantId: string, userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.createdAt >= :today', { today })
      .andWhere("order.status != 'cancelled'"); // Exclude cancelled

    if (userId) {
      query.andWhere('order.userId = :userId', { userId });
    }

    const todayOrders = await query.getMany();

    const pendingWhere: any = { tenantId, status: 'pending' };
    if (userId) {
      pendingWhere.userId = userId;
    }

    const pendingCount = await this.ordersRepository.count({
      where: pendingWhere,
    });

    const todaySales = todayOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const todayCount = todayOrders.length;

    return {
      todaySales,
      todayCount,
      pendingCount,
    };
  }

  async removeAllByTenant(tenantId: string) {
    const orders = await this.ordersRepository.find({ where: { tenantId } });
    if (orders.length > 0) {
      await this.ordersRepository.remove(orders);
    }
    return { deleted: true, count: orders.length };
  }
}
