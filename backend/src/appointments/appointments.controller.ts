import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Req() req: any) {
    const user = req.user;
    if (
      user.tenantId !== createAppointmentDto.tenantId &&
      user.role !== 'superadmin'
    ) {
      throw new ForbiddenException('No puedes crear citas para otro tenant');
    }

    // Security: If user is normal user, force clientId to be their own ID
    if (user.role === 'user') {
      createAppointmentDto.clientId = user.userId || user.sub || user.id;
    }

    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get('stats/:tenantId')
  async getStats(@Param('tenantId') tenantId: string, @Req() req: any) {
    const user = req.user;
    if (user.role !== 'superadmin' && user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'No tienes permiso para ver estadísticas de otro tenant',
      );
    }
    const targetUserId = user.role === 'user' ? user.id : undefined;
    return this.appointmentsService.getDashboardStats(tenantId, targetUserId);
  }

  @Get('all')
  findAllGlobal(@Req() req: any) {
    const user = req.user;
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Solo el superadmin puede ver todas las citas');
    }
    return this.appointmentsService.findAllGlobal();
  }

  @Get('tenant/:tenantId')
  findAll(
    @Param('tenantId') tenantId: string,
    @Req() req: any,
    @Query('userId') userId?: string,
  ) {
    const user = req.user;
    if (user.role !== 'superadmin' && user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'No tienes permiso para ver citas de otro tenant',
      );
    }

    // If user is not admin/superadmin, force filtering by their own ID
    if (user.role === 'user') {
      return this.appointmentsService.findAllByTenantAndUser(
        tenantId,
        user.userId || user.sub || user.id,
      );
    }

    if (userId) {
      return this.appointmentsService.findAllByTenantAndUser(tenantId, userId);
    }

    return this.appointmentsService.findAllByTenant(tenantId);
  }

  @Get('doctor/:doctorId')
  findAllByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findAllByDoctor(doctorId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    const user = req.user;
    // Only admin/superadmin/staff can update status. Users cannot.
    if (user.role === 'user') {
      throw new ForbiddenException(
        'No tienes permiso para actualizar el estado de la cita',
      );
    }
    return this.appointmentsService.updateStatus(id, status);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateAppointmentDto,
    @Req() req: any,
  ) {
    const user = req.user;

    // Check ownership if user
    if (user.role === 'user') {
      const appointment = await this.appointmentsService.findOne(id);
      if (!appointment) return null;

      if (appointment.clientId !== user.id) {
        throw new ForbiddenException(
          'No puedes editar una cita que no es tuya',
        );
      }

      // Users can only update specific fields (e.g. notes, or maybe reschedule?)
      // For now, let's allow them to update, but ensure they can't change the 'status' or 'price' via this endpoint if payload has it.
      // Sanitizing payload:
      delete (updateData as any).status;
      delete (updateData as any).price;
      delete (updateData as any).doctorId; // Cannot change doctor? Maybe allow.
    }

    return this.appointmentsService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    if (user.role === 'user') {
      const appointment = await this.appointmentsService.findOne(id);
      if (!appointment) return { deleted: false };

      if (appointment.clientId !== user.id) {
        throw new ForbiddenException(
          'No puedes eliminar una cita que no es tuya',
        );
      }
    }

    return this.appointmentsService.remove(id);
  }
}
