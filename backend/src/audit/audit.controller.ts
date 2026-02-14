import { Controller, Get, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(@Request() req, @Query('limit') limit?: number) {
    // Only Admin or Superadmin can see logs
    if (req.user.role === 'user') {
      throw new ForbiddenException('Access denied to audit logs');
    }
    
    // Superadmin can see any tenant logs if tenantId query is provided, else sees their own context?
    // For now, let's stick to simple tenant isolation.
    return this.auditService.findAll(req.user.tenantId, limit || 50);
  }
}
