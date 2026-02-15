import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column()
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.

  @Column()
  entityType: string; // 'Order', 'Product', 'User', 'Tenant', etc.

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  details: string; // JSON string with old/new values or summary

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
