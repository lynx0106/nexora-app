import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type {
  CreateAutomationDto,
  UpdateAutomationDto,
} from './automations.service';
import { AutomationsService } from './automations.service';

@Controller('automations')
@UseGuards(AuthGuard('jwt'))
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user!;

    // Only admin, owner, and superadmin can view automations
    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException(
        'No tienes permiso para ver automatizaciones',
      );
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    return this.automationsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user!;

    // Only admin, owner, and superadmin can view automation details
    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException(
        'No tienes permiso para ver esta automatización',
      );
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    return this.automationsService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() createAutomationDto: CreateAutomationDto, @Req() req: Request) {
    const user = req.user!;

    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException(
        'No tienes permiso para crear automatizaciones',
      );
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    const userId = user.userId;

    return this.automationsService.create(
      createAutomationDto,
      tenantId,
      userId,
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAutomationDto: UpdateAutomationDto,
    @Req() req: Request,
  ) {
    const user = req.user!;

    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar automatizaciones',
      );
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    return this.automationsService.update(id, updateAutomationDto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user!;

    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar automatizaciones',
      );
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    return this.automationsService.remove(id, tenantId);
  }

  @Post(':id/toggle')
  toggle(@Param('id') id: string, @Req() req: Request) {
    const user = req.user!;

    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException(
        'No tienes permiso para modificar automatizaciones',
      );
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    return this.automationsService.toggle(id, tenantId);
  }

  @Post(':id/run')
  runNow(@Param('id') id: string, @Req() req: Request) {
    const user = req.user!;

    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException(
        'No tienes permiso para ejecutar automatizaciones',
      );
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    const userId = user.userId;
    if (!userId) throw new ForbiddenException('Usuario no identificado');

    return this.automationsService.runNow(id, tenantId, userId);
  }

  @Get(':id/runs')
  getRuns(@Param('id') id: string, @Req() req: Request) {
    const user = req.user!;

    // Only admin, owner, and superadmin can view runs
    if (!['admin', 'owner', 'superadmin'].includes(user.role ?? '')) {
      throw new ForbiddenException('No tienes permiso para ver el historial');
    }

    const tenantId = user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant no identificado');
    return this.automationsService.getRuns(id, tenantId);
  }
}
