import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Automation } from './automation.entity';
import { User } from '../../users/entities/user.entity';

export enum AutomationRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('automation_runs')
@Index(['automationId'])
@Index(['status'])
@Index(['startedAt'])
export class AutomationRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Automation, (automation) => automation.runs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'automationId' })
  automation: Automation;

  @Column({ type: 'text' })
  automationId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AutomationRunStatus.PENDING,
  })
  status: AutomationRunStatus;

  @Column({ type: 'jsonb', default: {} })
  result: Record<string, any>;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'executedBy' })
  executedBy: User;

  @Column({ type: 'text', nullable: true })
  executedById: string;
}
