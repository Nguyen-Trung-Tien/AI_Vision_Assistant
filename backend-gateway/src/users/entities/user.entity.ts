import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DetectionLog } from '../../vision/entities/detection-log.entity';
import { EmergencyContact } from '../../emergency-contact/entities/emergency-contact.entity';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ nullable: true })
  full_name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  accessibility_prefs?: any;

  @OneToMany(() => DetectionLog, (log) => log.user)
  detectionLogs!: DetectionLog[];

  @OneToMany(() => EmergencyContact, (contact) => contact.user)
  emergencyContacts!: EmergencyContact[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
