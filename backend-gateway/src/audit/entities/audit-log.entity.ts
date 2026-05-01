import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ nullable: true })
  admin_id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column()
  action: string; // "RESOLVE_SOS", "BAN_USER", "BROADCAST", "REVIEW_FEEDBACK", "LOGIN", etc.

  @Column()
  target_type: string; // "user", "sos", "feedback", "broadcast", "system"

  @Column({ nullable: true })
  target_id: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}
