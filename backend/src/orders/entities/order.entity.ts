import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('orders')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'paymentStatus'])
@Index(['tenantId', 'userId'])
@Index(['publicTokenHash'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: any;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'completed' })
  status: string;

  @Column({ default: 'pending' })
  paymentStatus: string; // pending, paid, refunded

  @Column({ default: 'cash' })
  paymentMethod: string; // cash, card, stripe

  @Column({ nullable: true })
  paymentLink: string; // URL for MercadoPago payment

  @Column({ nullable: true })
  preferenceId: string; // MercadoPago Preference ID

  @Column({ type: 'text', nullable: true })
  publicTokenHash: string;

  @Column({ type: 'timestamptz', nullable: true })
  publicTokenExpiresAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
