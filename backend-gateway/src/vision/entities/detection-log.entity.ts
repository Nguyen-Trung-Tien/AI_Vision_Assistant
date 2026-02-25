import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('detection_logs')
export class DetectionLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => User, (user) => user.detectionLogs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ length: 50 })
  action_type: string; // OCR, OBJECT_DETECT, CAPTIONING

  @Column({ type: 'text', nullable: true })
  result_text: string;

  @Column({ type: 'float', nullable: true })
  confidence_score: number;

  @CreateDateColumn()
  created_at: Date;
}
