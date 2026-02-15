import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('appointments')
@Index(['tenantId', 'dateTime'])
@Index(['status'])
@Index(['doctorId'])
@Index(['clientId'])
@Index(['serviceId'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @Column()
  dateTime: Date;

  @Column({ default: 'pending' }) // pending, confirmed, cancelled, completed
  status: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  pax: number; // Number of people (for restaurants/events)

  @Column({ nullable: true })
  occasion: string; // Special occasion (Birthday, Anniversary, etc.)

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Column({ type: 'uuid', nullable: true })
  doctorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'serviceId' })
  service: Product;

  @Column({ type: 'uuid', nullable: true })
  serviceId: string;

  @Column({ default: false })
  reminderSent24h: boolean;

  @Column({ default: false })
  reminderSent2h: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
