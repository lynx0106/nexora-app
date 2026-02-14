import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('ai_usage')
export class AiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ default: 'openai' })
  provider: string;

  @Column()
  model: string;

  @Column({ type: 'int', default: 0 })
  inputTokens: number;

  @Column({ type: 'int', default: 0 })
  outputTokens: number;

  @Column({ type: 'int', default: 0 })
  totalTokens: number;

  @Column({ nullable: true })
  scope: string; // CUSTOMER, SUPPORT, INTERNAL

  @CreateDateColumn()
  createdAt: Date;
}
