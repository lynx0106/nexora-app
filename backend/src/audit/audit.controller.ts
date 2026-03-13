import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request as ExpressRequest } from 'express';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(
    @Request() req: ExpressRequest,
    @Query('limit') limit?: number,
  ) {
    const user = req.user!;
    if (user.role === 'client') {
      throw new ForbiddenException('Access denied to audit logs');
    }
    return this.auditService.findAll(user.tenantId ?? '', limit || 50);
  }
}
