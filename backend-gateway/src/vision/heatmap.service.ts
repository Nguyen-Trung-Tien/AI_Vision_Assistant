import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetectionLog } from './entities/detection-log.entity';
import { SosAlert } from '../sos/entities/sos-alert.entity';

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
    @InjectRepository(SosAlert)
    private readonly sosRepo: Repository<SosAlert>,
  ) {}

  async getHeatmapData(
    type: string = 'danger',
    days: number = 30,
  ): Promise<HeatmapPoint[]> {
    // 1. Get detection logs
    const detectionQb = this.logRepo
      .createQueryBuilder('log')
      .select('log.latitude', 'lat')
      .addSelect('log.longitude', 'lng')
      .addSelect('COUNT(*)', 'count')
      .where('log.latitude IS NOT NULL')
      .andWhere('log.longitude IS NOT NULL')
      .andWhere("log.created_at >= NOW() - INTERVAL '1 day' * :days", { days });

    if (type === 'danger') {
      detectionQb.andWhere(
        "log.action_type = 'CAPTION' AND log.severity IN ('HIGH', 'CRITICAL')",
      );
    }
    detectionQb.groupBy('log.latitude, log.longitude');
    const detectionRows = await detectionQb.getRawMany();

    // 2. Get SOS alerts (always considered high danger)
    interface RawRow {
      lat: string | number;
      lng: string | number;
      count: string | number;
    }

    const sosRows: RawRow[] = [];
    if (type === 'danger' || type === 'all') {
      const sosQb = this.sosRepo
        .createQueryBuilder('sos')
        .select('sos.latitude', 'lat')
        .addSelect('sos.longitude', 'lng')
        .addSelect('COUNT(*) * 5', 'count') // Weigh SOS higher (x5 intensity)
        .where('sos.latitude IS NOT NULL')
        .andWhere('sos.longitude IS NOT NULL')
        .andWhere("sos.created_at >= NOW() - INTERVAL '1 day' * :days", {
          days,
        })
        .groupBy('sos.latitude, sos.longitude');

      sosRows.push(...(await sosQb.getRawMany()));
    }

    // 3. Combine results
    const combinedMap = new Map<string, number>();

    const merge = (rows: RawRow[]) => {
      for (const r of rows) {
        const key = `${parseFloat(r.lat.toString()).toFixed(5)},${parseFloat(r.lng.toString()).toFixed(5)}`;
        const count = parseInt(r.count.toString(), 10);
        combinedMap.set(key, (combinedMap.get(key) || 0) + count);
      }
    };

    merge(detectionRows);
    merge(sosRows);

    const result: HeatmapPoint[] = [];
    combinedMap.forEach((intensity, key) => {
      const [lat, lng] = key.split(',').map(parseFloat);
      result.push({ lat, lng, intensity });
    });

    return result;
  }
}
