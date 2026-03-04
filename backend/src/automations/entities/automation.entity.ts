import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { AutomationRun } from './automation-run.entity';

export enum AutomationType {
  REMINDER = 'reminder',
  BULK_MESSAGE = 'bulk_message',
  INDIVIDUAL_MESSAGE = 'individual_message',
  CLEANUP = 'cleanup',
}

export enum AutomationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('automations')
@Index(['tenantId'])
@Index(['enabled'])
@Index(['nextRunAt'])
export class Automation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'text' })
  tenantId: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type: AutomationType;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true, length: 100 })
  schedule: string; // cron expression

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  lastRunAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  nextRunAt: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @Column({ type: 'text', nullable: true })
  createdById: string;

  @OneToMany(() => AutomationRun, (run) => run.automation)
  runs: AutomationRun[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
