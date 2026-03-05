import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('broadcasts')
export class Broadcast {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: User | null;

  @Column({ name: 'admin_id', nullable: true })
  adminId: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 20, default: 'all' })
  target_type: string; // all, group, specific

  @Column('uuid', { array: true, nullable: true })
  target_ids: string[];

  @Column({ length: 10, default: 'normal' })
  priority: string; // low, normal, high, urgent

  @Column({ type: 'int', default: 0 })
  sent_count: number;

  @CreateDateColumn()
  created_at: Date;
}
