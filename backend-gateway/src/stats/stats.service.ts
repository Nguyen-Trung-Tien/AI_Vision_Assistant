import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetectionLog } from '../vision/entities/detection-log.entity';
import { User } from '../users/entities/user.entity';

interface RawStatRow {
  type?: string;
  count?: string;
  date?: string;
  avg?: string;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(DetectionLog)
    private readonly detectionLogRepo: Repository<DetectionLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getOverview() {
    const totalUsers = await this.userRepo.count();
    const totalDetections = await this.detectionLogRepo.count();

    const avgResult: RawStatRow =
      (await this.detectionLogRepo
        .createQueryBuilder('log')
        .select('AVG(log.confidence_score)', 'avg')
        .where('log.confidence_score IS NOT NULL')
        .getRawOne()) ?? {};

    return {
      totalUsers,
      totalDetections,
      avgConfidence: parseFloat(avgResult.avg ?? '0'),
    };
  }

  async getByType() {
    const results: RawStatRow[] = await this.detectionLogRepo
      .createQueryBuilder('log')
      .select('log.action_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action_type')
      .getRawMany();

    return results.map((r) => ({
      type: r.type ?? 'UNKNOWN',
      count: parseInt(r.count ?? '0', 10),
    }));
  }

  async getByDay(days: number = 30) {
    const results: RawStatRow[] = await this.detectionLogRepo
      .createQueryBuilder('log')
      .select('log.created_at::date', 'date')
      .addSelect('COUNT(*)', 'count')
      .where("log.created_at >= NOW() - INTERVAL '1 day' * :days", { days })
      .groupBy('log.created_at::date')
      .orderBy('log.created_at::date', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date ?? '',
      count: parseInt(r.count ?? '0', 10),
    }));
  }

  async getLogs(page: number = 1, limit: number = 20) {
    const [logs, total] = await this.detectionLogRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
