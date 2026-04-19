import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SosAlert } from '../sos/entities/sos-alert.entity';
import { DetectionLog } from '../vision/entities/detection-log.entity';
import { format } from 'date-fns';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(SosAlert)
    private sosRepo: Repository<SosAlert>,
    @InjectRepository(DetectionLog)
    private detectionRepo: Repository<DetectionLog>,
  ) {}

  async exportUsers(): Promise<string> {
    const users = await this.userRepo.find();

    const header = 'ID,Full Name,Email,Phone,Created At\n';

    const rows = users
      .map((u) =>
        [
          u.id,
          this.escapeCSV(u.full_name),
          this.escapeCSV(u.email),
          this.escapeCSV(u.phone),
          this.formatDate(u.created_at),
        ].join(','),
      )
      .join('\n');

    return '\uFEFF' + header + rows;
  }

  async exportSosHistory(): Promise<string> {
    const alerts = await this.sosRepo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    const header = 'ID,User,Email,Latitude,Longitude,Status,Time\n';

    const rows = alerts
      .map((a) =>
        [
          a.id,
          this.escapeCSV(a.user?.full_name || 'Unknown'),
          this.escapeCSV(a.user?.email),
          a.latitude,
          a.longitude,
          this.escapeCSV(a.status),
          this.formatDate(a.created_at),
        ].join(','),
      )
      .join('\n');

    return '\uFEFF' + header + rows;
  }

  async exportActivityLogs(): Promise<string> {
    const logs = await this.detectionRepo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: 1000,
    });

    const header = 'ID,User,Action,Model,Confidence,Time\n';

    const rows = logs
      .map((l) =>
        [
          l.id,
          this.escapeCSV(l.user?.full_name || 'Unknown'),
          this.escapeCSV(l.action_type),
          this.escapeCSV(l.model_version),
          l.confidence_score ?? 0,
          this.formatDate(l.created_at),
        ].join(','),
      )
      .join('\n');

    return '\uFEFF' + header + rows;
  }

  private escapeCSV(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (!str.includes(',') && !str.includes('"') && !str.includes('\n')) {
      return str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    try {
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return String(date);
    }
  }
}
