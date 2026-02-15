import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { Role, hasRole } from '../common/constants/roles';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() body: CreateOrderDto, @Req() req: any) {
    const user = req.user;
    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== body.tenantId) {
      throw new ForbiddenException('No puedes crear pedidos para otro tenant');
    }
    return this.ordersService.create(body);
  }

  @Get('all')
  findAllGlobal(@Req() req: any) {
    const user = req.user;
    if (!hasRole(user.role, [Role.Superadmin])) {
      throw new ForbiddenException('Solo el superadmin puede ver todos los pedidos');
    }
    return this.ordersService.findAllGlobal();
  }

  @Get('tenant/:tenantId')
  findAll(
    @Param('tenantId') tenantId: string,
    @Req() req: any,
    @Query('userId') userId?: string,
  ) {
    const user = req.user;
    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'No tienes permiso para ver pedidos de otro tenant',
      );
    }

    if (hasRole(user.role, [Role.User])) {
      return this.ordersService.findAllByTenantAndUser(tenantId, user.id);
    }

    if (userId) {
      return this.ordersService.findAllByTenantAndUser(tenantId, userId);
    }

    return this.ordersService.findAllByTenant(tenantId);
  }

  @Get('stats/:tenantId')
  getStats(@Param('tenantId') tenantId: string, @Req() req: any) {
    const user = req.user;
    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'No tienes permiso para ver estadísticas de otro tenant',
      );
    }

    const targetUserId = hasRole(user.role, [Role.User]) ? user.id : undefined;
    return this.ordersService.getDashboardStats(tenantId, targetUserId);
  }

  @Get('top-products/:tenantId')
  getTopProducts(
    @Param('tenantId') tenantId: string,
    @Query('userId') userId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso');
    }

    // If userId query param is present, use it (Admin viewing specific user)
    // If not present:
    //    If user.role === 'user', use user.id (User viewing their own)
    //    If user.role === 'admin' | 'superadmin', pass undefined (Admin viewing Global)

    let targetUserId = userId;
    if (!targetUserId && hasRole(user.role, [Role.User])) {
      targetUserId = user.id;
    }

    return this.ordersService.getTopProducts(tenantId, targetUserId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateOrderDto, @Req() req: any) {
    const user = req.user;

    if (hasRole(user.role, [Role.User])) {
      const order = await this.ordersService.findOne(id);
      if (!order) return null;

      if (order.userId !== user.id) {
        throw new ForbiddenException(
          'No puedes modificar un pedido que no es tuyo',
        );
      }

      // Users can ONLY Cancel their order. They cannot change payment status or complete it.
      // If they try to set anything else, ignore or throw.
      if (body.status && body.status !== 'cancelled') {
        throw new ForbiddenException(
          'No tienes permiso para cambiar el estado de este pedido',
        );
      }

      // Prevent changing payment status manually
      if (body.paymentStatus) {
        delete body.paymentStatus;
      }

      // Allow cancellation or address update?
      // For now, assume mainly cancellation or maybe updating shipping address if needed.
      // If body has nothing left relevant, it effectively does nothing.
    }

    return this.ordersService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    if (hasRole(user.role, [Role.User])) {
      const order = await this.ordersService.findOne(id);
      if (!order) return { deleted: false };

      if (order.userId !== user.id) {
        throw new ForbiddenException(
          'No puedes eliminar un pedido que no es tuyo',
        );
      }
    }

    return this.ordersService.remove(id);
  }
}
