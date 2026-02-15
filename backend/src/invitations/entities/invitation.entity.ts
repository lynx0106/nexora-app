import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('invitations')
@Index(['tenantId', 'email'])
@Index(['tokenHash'], { unique: true })
@Index(['acceptedAt'])
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  email: string;

  @Column()
  role: string;

  @Column({ type: 'uuid', nullable: true })
  inviterUserId: string | null;

  @Column({ type: 'text' })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
