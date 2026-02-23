import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export type InvitationStatus = 'pending' | 'used' | 'expired';
export type InvitationRole = 'client' | 'employee' | 'staff';

@Entity('invitation_codes')
export class InvitationCode {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: ['client', 'employee', 'staff'],
    default: 'client',
  })
  role: InvitationRole;

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({
    type: 'enum',
    enum: ['pending', 'used', 'expired'],
    default: 'pending',
  })
  status: InvitationStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  usedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usedBy' })
  user: User;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Verifica si la invitación está expirada
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Verifica si la invitación puede ser usada
   */
  isValid(): boolean {
    return this.status === 'pending' && !this.isExpired();
  }
}
