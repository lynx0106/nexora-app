import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Role, hasRole } from '../common/constants/roles';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('test-ping')
  testPing() {
    return { message: 'pong' };
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: any, @Req() req: Request, @Body() body: any) {
    const user = (req as any).user;

    if (!user) {
      throw new ForbiddenException('No tienes permiso para cargar productos');
    }

    let targetTenantId = user.tenantId;
    if (hasRole(user.role, [Role.Superadmin]) && body.tenantId) {
      targetTenantId = body.tenantId;
    }

    if (!targetTenantId) {
      throw new ForbiddenException('Tenant ID requerido');
    }

    return this.productsService.uploadProducts(file.buffer, targetTenantId);
  }

  @Post('seed/:tenantId')
  @UseGuards(AuthGuard('jwt'))
  seed(@Param('tenantId') tenantId: string, @Req() req: Request) {
    const user = (req as any).user;

    if (!user || !hasRole(user.role, [Role.Superadmin])) {
      throw new ForbiddenException('Solo superadmin puede ejecutar seeds');
    }

    if (process.env.ALLOW_PRODUCT_SEED !== 'true') {
      throw new ForbiddenException('Seed deshabilitado en este entorno');
    }

    return this.productsService.seedProducts(tenantId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user;

    let targetTenantId = user.tenantId;
    if (hasRole(user.role, [Role.Superadmin]) && body.tenantId) {
      targetTenantId = body.tenantId;
    }

    if (!targetTenantId) {
      throw new ForbiddenException(
        'No tienes permiso para crear productos (Falta Tenant ID)',
      );
    }

    return this.productsService.create({
      ...body,
      tenantId: targetTenantId,
    });
  }

  @Get('tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'))
  findAllByTenant(@Param('tenantId') tenantId: string, @Req() req: Request) {
    const user = (req as any).user;
    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'No tienes permiso para ver productos de otro tenant',
      );
    }
    return this.productsService.findAllByTenant(tenantId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) {
      throw new ForbiddenException('No tienes permiso para ver productos');
    }
    if (hasRole(user.role, [Role.Superadmin])) {
      return this.productsService.findAll();
    }
    if (!user.tenantId) {
      throw new ForbiddenException('No tienes permiso para ver productos');
    }
    return this.productsService.findAllByTenant(user.tenantId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    return this.productsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const user = (req as any).user;
    if (hasRole(user.role, [Role.Superadmin])) {
      return this.productsService.updateAsAdmin(id, body);
    }
    return this.productsService.update(id, user.tenantId, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    if (hasRole(user.role, [Role.Superadmin])) {
      return this.productsService.removeAsAdmin(id);
    }
    return this.productsService.remove(id, user.tenantId);
  }
}
