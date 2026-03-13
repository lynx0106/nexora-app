import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
@Index(['tenantId'])
@Index(['role'])
@Index(['isActive'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  role: string; // 'superadmin', 'admin', 'employee', 'client'

  @Column({ type: 'varchar', length: 80, nullable: true })
  employeeType: string | null; // Clasificación dentro de empleados: medico, recepcionista, auxiliar, etc.

  @Column({ nullable: true })
  tenantId: string; // ID del negocio al que pertenece

  @Column({ default: true })
  isAiChatActive: boolean; // Controls if AI responds to this user

  @Column({ type: 'boolean', default: true })
  onboardingCompleted: boolean; // Wizard guiado primera vez (perfil no técnico)

  @Column({ type: 'text', nullable: true })
  passwordResetTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetTokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
