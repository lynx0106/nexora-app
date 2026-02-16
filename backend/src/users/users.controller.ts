import {
  Put,
  Delete,
  Param,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { TenantsService } from '../tenants/tenants.service';
import type { Request } from 'express';
import { Role, hasRole } from '../common/constants/roles';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: AuthRequest) {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    const user = await this.usersService
      .findByTenant(tenantId)
      .then((users) => users.find((u) => u.id === userId));

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    const { passwordHash: _, ...safeUser } = user;
    void _;
    return safeUser;
  }

  @Get('tenants/summary')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.TenantRead)
  async getTenantsSummary(@Req() req: AuthRequest) {
    const role = req.user?.role;
    if (!hasRole(role, [Role.Superadmin])) {
      throw new ForbiddenException(
        'Solo el superadmin puede ver métricas globales de tenants',
      );
    }
    const summary = await this.usersService.getTenantsSummary();
    return summary;
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;

    if (!userId || !tenantId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    // Determine allowed fields based on role and sector
    let allowedUpdates: any = {};

    if (role === 'user') {
      const tenant = await this.tenantsService.getTenantOrThrow(tenantId);
      const sector = tenant.sector || 'otros';

      // Common allowed fields
      if (dto.avatarUrl !== undefined) allowedUpdates.avatarUrl = dto.avatarUrl;
      if (dto.password) allowedUpdates.password = dto.password;

      // Sector-specific allowed fields
      // Service/Health: Phone
      const isService = [
        'salud',
        'legal',
        'educacion',
        'servicios',
        'restaurante',
        'otros',
      ].includes(sector);
      // Retail: Address
      const isRetail = [
        'retail',
        'comercio',
        'restaurante',
        'belleza',
        'otros',
      ].includes(sector);

      if (isService) {
        if (dto.phone !== undefined) allowedUpdates.phone = dto.phone;
      }

      if (isRetail) {
        if (dto.address !== undefined) allowedUpdates.address = dto.address;
      }

      // Explicitly ignore firstName, lastName, email for 'user' role
    } else {
      // Admin/Superadmin can update everything
      allowedUpdates = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        avatarUrl: dto.avatarUrl,
        password: dto.password,
      };
    }

    try {
      const user = await this.usersService.updateUser(
        userId,
        tenantId,
        allowedUpdates,
      );

      const { passwordHash: _, ...safeUser } = user;
      void _;
      return safeUser;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el perfil';
      throw new ForbiddenException(message);
    }
  }

  @Get('tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserRead)
  async findByTenantId(
    @Param('tenantId') tenantId: string,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!hasRole(user?.role, [Role.Superadmin]) && user?.tenantId !== tenantId) {
      throw new ForbiddenException(
        'No tienes permiso para ver usuarios de otro tenant',
      );
    }

    const users = await this.usersService.findByTenant(tenantId);
    return users.map(({ passwordHash: _, ...safeUser }) => {
      void _;
      return safeUser;
    });
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserRead)
  async findAllGlobal(@Req() req: AuthRequest) {
    const user = req.user;
    if (!hasRole(user?.role, [Role.Superadmin])) {
      throw new ForbiddenException('Acceso denegado');
    }
    const users = await this.usersService.findAllGlobal();
    return users.map(({ passwordHash: _, ...safeUser }) => {
      void _;
      return safeUser;
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    const requestUser = req.user;

    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    // Security check
    if (!hasRole(requestUser?.role, [Role.Superadmin])) {
      // If not superadmin, must be same tenant
      if (user.tenantId !== requestUser?.tenantId) {
        throw new ForbiddenException('No tienes permiso para ver este usuario');
      }
    }

    const { passwordHash: _, ...safeUser } = user;
    void _;
    return safeUser;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAllForTenant(@Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;

    if (!tenantId) {
      throw new ForbiddenException('Tenant no asignado');
    }

    // Si es user, permitimos ver solo el STAFF (no otros clientes)
    if (!hasRole(role, [Role.Admin, Role.Superadmin, Role.User])) {
      throw new ForbiddenException('No tienes permisos para listar usuarios');
    }

    const users = await this.usersService.findByTenant(tenantId);

    // Filtro de privacidad para usuarios normales
    if (hasRole(role, [Role.User])) {
      return users
        .filter((u) => u.role !== 'user') // Solo mostrar staff
        .map(({ passwordHash: _, ...safeUser }) => {
          void _;
          return safeUser;
        });
    }

    return users.map(({ passwordHash: _, ...safeUser }) => {
      void _;
      return safeUser;
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserManage)
  async create(@Req() req: AuthRequest, @Body() body: CreateUserDto) {
    const userRole = req.user?.role;
    const userTenantId = req.user?.tenantId;

    if (!hasRole(userRole, [Role.Admin, Role.Superadmin])) {
      throw new ForbiddenException('No tienes permisos para crear usuarios');
    }

    // Determine target tenant
    let targetTenantId = userTenantId;
    if (hasRole(userRole, [Role.Superadmin]) && body.tenantId) {
      targetTenantId = body.tenantId;
    }

    if (!targetTenantId) {
      throw new ForbiddenException('Tenant ID requerido');
    }

    try {
      const user = await this.usersService.createUserForTenant(targetTenantId, {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: body.password || 'TempPass123!',
        role: body.role || 'user',
        phone: body.phone,
        address: body.address,
      });
      const { passwordHash: _, ...safeUser } = user;
      void _;
      return safeUser;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error creando usuario';
      throw new BadRequestException(message);
    }
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserRead)
  async findAllForAllTenants(@Req() req: AuthRequest) {
    const role = req.user?.role;
    if (!hasRole(role, [Role.Superadmin])) {
      throw new ForbiddenException(
        'Solo el superadmin puede listar todos los usuarios',
      );
    }

    const users = await this.usersService.findAllUsersAllTenants();
    return users.map(({ passwordHash: _, ...safeUser }) => {
      void _;
      return safeUser;
    });
  }

  @Get('by-tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserRead)
  async findByTenantForSuperadmin(
    @Req() req: AuthRequest,
    @Param('tenantId') tenantId: string,
  ) {
    const role = req.user?.role;
    if (!hasRole(role, [Role.Superadmin])) {
      throw new ForbiddenException(
        'Solo el superadmin puede listar usuarios por tenant',
      );
    }

    const users = await this.usersService.findByTenant(tenantId);
    return users.map(({ passwordHash: _, ...safeUser }) => {
      void _;
      return safeUser;
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserManage)
  async createForTenant(@Req() req: AuthRequest, @Body() dto: CreateUserDto) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    if (!tenantId) {
      throw new ForbiddenException('Tenant no asignado');
    }
    if (!hasRole(role, [Role.Admin, Role.Superadmin])) {
      throw new ForbiddenException('No tienes permisos para crear usuarios');
    }

    if (!dto.password) {
      throw new BadRequestException('La contraseña es obligatoria');
    }

    try {
      const user = await this.usersService.createUserForTenant(tenantId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        password: dto.password,
        role: dto.role,
      });

      const { passwordHash: _, ...safeUser } = user;
      void _;
      return safeUser;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo crear el usuario';
      throw new ForbiddenException(message);
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateUser(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    const currentUserId = req.user?.userId;

    const targetUserId = id === 'profile' ? currentUserId : id;

    if (!targetUserId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant no asignado');
    }

    const isAdmin = hasRole(role, [Role.Admin, Role.Superadmin]);
    const isSelfUpdate = currentUserId === targetUserId;

    if (!isAdmin && !isSelfUpdate) {
      throw new ForbiddenException(
        'No tienes permisos para editar este usuario',
      );
    }

    try {
      const user = await this.usersService.updateUser(targetUserId, tenantId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        role: isAdmin ? dto.role : undefined,
        password: dto.password,
      });

      const { passwordHash: _, ...safeUser } = user;
      void _;
      return safeUser;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el usuario';
      throw new ForbiddenException(message);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserManage)
  async deleteUser(@Req() req: AuthRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    if (!tenantId) {
      throw new ForbiddenException('Tenant no asignado');
    }
    if (!hasRole(role, [Role.Admin, Role.Superadmin])) {
      throw new ForbiddenException('No tienes permisos para eliminar usuarios');
    }

    try {
      await this.usersService.deleteUser(id, tenantId);
      return { message: 'Usuario eliminado correctamente' };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el usuario';
      throw new ForbiddenException(message);
    }
  }

  @Post('seed-superadmin')
  async seedSuperAdmin() {
    return this.usersService.seedSuperAdmin();
  }

  @Post('seed-demo-users')
  async seedDemoUsers() {
    return this.usersService.seedDemoUsers();
  }

  @Post('seed-doctors/:tenantId')
  async seedDoctors(@Param('tenantId') tenantId: string) {
    return this.usersService.seedDoctors(tenantId);
  }

  @Post('seed-clients/:tenantId')
  async seedClients(@Param('tenantId') tenantId: string) {
    return this.usersService.seedClients(tenantId);
  }
}
