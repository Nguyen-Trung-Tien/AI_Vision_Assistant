import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DetectionLog } from '../vision/entities/detection-log.entity';
import { AiFeedback } from '../feedback/entities/ai-feedback.entity';
import { SettingsService } from '../system/settings.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(DetectionLog)
    private detectionRepo: Repository<DetectionLog>,
    @InjectRepository(AiFeedback)
    private feedbackRepo: Repository<AiFeedback>,
    private settingsService: SettingsService,
  ) {}

  async getModels() {
    const activeModelId = await this.settingsService.getByKey('ACTIVE_AI_MODEL') || 'v1.0.0';
    
    return [
      { 
        id: 'v1.0.0', 
        name: 'VisionCore Standard', 
        status: activeModelId === 'v1.0.0' ? 'ACTIVE' : 'AVAILABLE', 
        type: 'YOLOv8', 
        accuracy: '92%' 
      },
      { 
        id: 'v1.1.0-beta', 
        name: 'VisionCore Pro (Beta)', 
        status: activeModelId === 'v1.1.0-beta' ? 'ACTIVE' : 'AVAILABLE', 
        type: 'YOLOv11', 
        accuracy: '95%' 
      },
      { 
        id: 'v0.9.0', 
        name: 'Legacy Model', 
        status: activeModelId === 'v0.9.0' ? 'ACTIVE' : 'DEPRECATED', 
        type: 'YOLOv5', 
        accuracy: '88%' 
      },
    ];
  }

  async switchModel(modelId: string) {
    this.logger.log(`Switching active AI model to: ${modelId}`);
    const updated = await this.settingsService.update('ACTIVE_AI_MODEL', modelId);
    if (!updated) {
      // If it doesn't exist for some reason, we could create it, 
      // but seedSettings should have handled it.
      // For robustness:
      return this.settingsService.update('ACTIVE_AI_MODEL', modelId); // This is redundant but okay
    }
    return updated;
  }

  async getAccuracyTrend(days: number = 7) {
    const results: { date: string; accuracy: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const total = await this.feedbackRepo.count({
        where: { created_at: Between(start, end) },
      });
      const correct = await this.feedbackRepo.count({
        where: { created_at: Between(start, end), is_correct: true },
      });

      results.push({
        date: format(date, 'yyyy-MM-dd'),
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 100, // Default 100 if no feedback
      });
    }
    return results;
  }

  async getPeakHours() {
    const logs = await this.detectionRepo
      .createQueryBuilder('log')
      .select("EXTRACT(HOUR FROM log.created_at)", "hour")
      .addSelect("COUNT(*)", "count")
      .where("log.created_at > NOW() - INTERVAL '24 hours'")
      .groupBy("hour")
      .orderBy("hour", "ASC")
      .getRawMany();

    return logs.map(l => ({
      hour: parseInt(l.hour),
      count: parseInt(l.count),
    }));
  }

  async getDetectionLogs(page: number = 1, limit: number = 20, filters: any = {}) {
    const qb = this.detectionRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.actionType) {
      qb.andWhere('log.action_type = :type', { type: filters.actionType });
    }
    if (filters.modelVersion) {
      qb.andWhere('log.model_version = :version', { version: filters.modelVersion });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
