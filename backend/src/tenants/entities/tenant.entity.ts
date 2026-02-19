import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tenants')
@Index(['createdAt'])
export class Tenant {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ 
    type: 'enum', 
    enum: ['restaurant', 'hotel', 'clinic', 'retail', 'services', 'gym', 'salon', 'other'],
    default: 'other'
  })
  businessType: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: '09:00' })
  openingTime: string = '09:00';

  @Column({ default: '18:00' })
  closingTime: string = '18:00';

  @Column({ default: 60 })
  appointmentDuration: number = 60;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  aiPromptCustomer: string;

  @Column({ type: 'text', nullable: true })
  aiPromptSupport: string;

  @Column({ type: 'text', nullable: true })
  aiPromptInternal: string;

  @Column({ type: 'text', nullable: true })
  mercadoPagoAccessToken: string;

  @Column({ type: 'text', nullable: true })
  mercadoPagoPublicKey: string;

  @Column({ type: 'text', nullable: true })
  openaiApiKey: string;

  @Column({ default: 'gpt-3.5-turbo' })
  aiModel: string;

  @Column({ type: 'int', nullable: true })
  tablesCount: number;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
