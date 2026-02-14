import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async logAction(data: {
    tenantId: string;
    userId?: string;
    userEmail?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }) {
    const log = this.auditRepository.create(data);
    return await this.auditRepository.save(log);
  }

  async findAll(tenantId: string, limit: number = 50) {
    return await this.auditRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
