import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 100, nullable: true })
  socket_id: string;

  @Column({ type: 'jsonb', nullable: true })
  device_info: any;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  connected_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  disconnected_at: Date;
}
