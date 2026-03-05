import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetectionLog } from './entities/detection-log.entity';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

@Injectable()
export class HeatmapService {
  constructor(
    @InjectRepository(DetectionLog)
    private readonly logRepo: Repository<DetectionLog>,
  ) {}

  async getHeatmapData(
    type: string = 'danger',
    days: number = 30,
  ): Promise<HeatmapPoint[]> {
    const qb = this.logRepo
      .createQueryBuilder('log')
      .select('log.latitude', 'lat')
      .addSelect('log.longitude', 'lng')
      .addSelect('COUNT(*)', 'count')
      .where('log.latitude IS NOT NULL')
      .andWhere('log.longitude IS NOT NULL')
      .andWhere("log.created_at >= NOW() - INTERVAL '1 day' * :days", { days });

    if (type === 'danger') {
      qb.andWhere(
        "log.action_type = 'OBJECT_DETECT' AND log.severity IN ('HIGH', 'CRITICAL')",
      );
    }

    qb.groupBy('log.latitude, log.longitude');

    const rows = (await qb.getRawMany()) as {
      lat: string;
      lng: string;
      count: string;
    }[];

    return rows.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      intensity: parseInt(r.count, 10),
    }));
  }
}
