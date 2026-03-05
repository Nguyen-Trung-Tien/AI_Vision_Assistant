import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DetectionLog } from '../../vision/entities/detection-log.entity';

@Entity('ai_feedbacks')
export class AiFeedback {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => DetectionLog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'detection_id' })
  detection: DetectionLog;

  @Column({ name: 'detection_id' })
  detectionId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'boolean' })
  is_correct: boolean;

  @Column({ length: 255, nullable: true })
  correct_label: string;

  @Column({ type: 'text', nullable: true })
  image_path: string;

  @Column({ length: 20, default: 'pending' })
  review_status: string; // pending, reviewed, exported

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: User | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date;
}
