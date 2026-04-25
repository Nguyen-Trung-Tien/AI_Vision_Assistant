import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
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
    @Inject('AI_SERVICE') private aiClient: ClientProxy,
  ) {}

  async getModels() {
    const activeModelId =
      (await this.settingsService.getByKey('ACTIVE_AI_MODEL')) || 'v1.0.0';

    return [
      {
        id: 'v1.0.0',
        name: 'VisionCore Standard (v11)',
        status: activeModelId === 'v1.0.0' ? 'ACTIVE' : 'AVAILABLE',
        type: 'YOLOv11',
        accuracy: '92%',
        objectPath: 'models/model-object-recognition/best.pt',
      },
      {
        id: 'v1.1.0-beta',
        name: 'VisionCore Pro (v11.1 Beta)',
        status: activeModelId === 'v1.1.0-beta' ? 'ACTIVE' : 'AVAILABLE',
        type: 'YOLOv11',
        accuracy: '95%',
        objectPath: 'models/model-object-recognition/pro_beta.pt',
      },
      {
        id: 'v0.9.0',
        name: 'VisionCore Lite (v11 Nano)',
        status: activeModelId === 'v0.9.0' ? 'ACTIVE' : 'AVAILABLE',
        type: 'YOLOv11',
        accuracy: '88%',
        objectPath: 'models/model-object-recognition/legacy.pt',
      },
    ];
  }

  async switchModel(modelId: string) {
    this.logger.log(`Switching active AI model to: ${modelId}`);

    // Find model details to get path
    const models = await this.getModels();
    const model = models.find((m) => m.id === modelId);

    const updated = await this.settingsService.update(
      'ACTIVE_AI_MODEL',
      modelId,
    );

    // Dispatch reload command to AI worker
    this.aiClient.emit('ai_tasks_queue', {
      taskType: 'RELOAD_MODEL',
      data: {
        modelId: modelId,
        objectPath: model?.objectPath,
      },
    });

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
      .select('EXTRACT(HOUR FROM log.created_at)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where("log.created_at > NOW() - INTERVAL '24 hours'")
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany<{ hour: string; count: string }>();

    return logs.map((l) => ({
      hour: parseInt(l.hour),
      count: parseInt(l.count),
    }));
  }

  async getDetectionLogs(
    page: number = 1,
    limit: number = 20,
    filters: { actionType?: string; modelVersion?: string } = {},
  ) {
    const qb = this.detectionRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    if (filters.actionType) {
      qb.andWhere('log.action_type = :actionType', {
        actionType: filters.actionType,
      });
    }

    if (filters.modelVersion) {
      qb.andWhere('log.model_version = :modelVersion', {
        modelVersion: filters.modelVersion,
      });
    }

    qb.orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLatestOtaModel() {
    const activeModelId =
      (await this.settingsService.getByKey('ACTIVE_AI_MODEL')) || 'v1.0.0';

    const models = await this.getModels();
    const activeModel = models.find((m) => m.id === activeModelId) || models[0];

    // Cung cấp URL download giả định (hoặc thực tế) tới file .tflite cho Mobile tải về
    return {
      version: activeModel.id,
      name: activeModel.name,
      downloadUrl: `https://storage.visionassistant.com/models/tflite/${activeModel.id}/detect.tflite`,
      hash: 'sha256-dummy-hash-xyz', // Thường sẽ là checksum của file model
      sizeBytes: 15_400_000, // 15MB
      minAppVersion: '1.5.0',
    };
  }
}
