import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import type { Request } from 'express';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(AuthGuard('jwt'))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get inventory dashboard with key metrics' })
  async getDashboard(@Req() req: Request & { user: any }) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return { error: 'Tenant not found' };
    }
    return this.inventoryService.getDashboard(tenantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  async getLowStock(@Req() req: Request & { user: any }) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return { error: 'Tenant not found' };
    }
    return this.inventoryService.getLowStockProducts(tenantId);
  }

  @Get('profitable')
  @ApiOperation({ summary: 'Get most profitable products' })
  async getProfitable(@Req() req: Request & { user: any }) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return { error: 'Tenant not found' };
    }
    return this.inventoryService.getTopProfitableProducts(tenantId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get recent stock movements' })
  async getMovements(@Req() req: Request & { user: any }) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return { error: 'Tenant not found' };
    }
    return this.inventoryService.getRecentStockMovements(tenantId);
  }

  @Get('valuation')
  @ApiOperation({ summary: 'Get full inventory valuation' })
  async getValuation(@Req() req: Request & { user: any }) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return { error: 'Tenant not found' };
    }
    return this.inventoryService.getInventoryValuation(tenantId);
  }

  @Put('product/:productId/cost')
  @ApiOperation({ summary: 'Update product cost and minimum stock' })
  async updateProductCost(
    @Req() req: Request & { user: any },
    @Param('productId') productId: string,
    @Body() body: { cost: number; minStock?: number },
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return { error: 'Tenant not found' };
    }
    return this.inventoryService.updateProductCost(
      tenantId,
      productId,
      body.cost,
      body.minStock,
    );
  }
}
