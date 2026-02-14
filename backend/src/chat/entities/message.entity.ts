import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ nullable: true })
  senderId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @Column({
    type: 'enum',
    enum: ['INTERNAL', 'SUPPORT', 'CUSTOMER'],
    default: 'INTERNAL',
  })
  scope: string;

  @Column({ nullable: true })
  targetUserId?: string; // For Customer chat (identifies the customer involved)

  @Column({ nullable: true })
  mediaUrl?: string;

  @Column({ default: 'text' })
  type: string; // text, image, file, audio

  @Column({ default: false })
  isAi: boolean;

  @Column({ default: false })
  isRead: boolean;
}
