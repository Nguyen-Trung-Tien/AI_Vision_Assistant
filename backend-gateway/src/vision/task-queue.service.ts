import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from 'socket.io';
import { DetectionLog } from './entities/detection-log.entity';

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);
  private server: Server;

  // Rate limiting: track last frame time per client
  private clientLastFrame: Map<string, number> = new Map();
  private readonly MIN_FRAME_INTERVAL_MS = 500; // Max 2 frames/second per client

  constructor(
    @Inject('AI_SERVICE') private client: ClientProxy,
    @InjectRepository(DetectionLog)
    private detectionLogRepo: Repository<DetectionLog>,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Kiểm tra rate limit cho client.
   * Returns true nếu cho phép, false nếu bị throttle.
   */
  checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const lastFrame = this.clientLastFrame.get(clientId) || 0;

    if (now - lastFrame < this.MIN_FRAME_INTERVAL_MS) {
      return false; // Throttled
    }

    this.clientLastFrame.set(clientId, now);
    return true;
  }

  // Push heavy tasks to RabbitMQ
  async pushHeavyTask(
    clientId: string,
    userId: string | undefined,
    taskType: string,
    frameData: string,
    lang: string = 'vi',
    warningDistanceM: number = 2.0,
  ) {
    this.logger.log(
      `Pushing task ${taskType} to RabbitMQ for client ${clientId} (userId: ${userId ?? 'anonymous'}, lang: ${lang})`,
    );
    // Emit event to rabbitmq queue 'ai_tasks_queue'
    this.client.emit('process_ai_task', {
      clientId,
      userId,
      taskType,
      frameData,
      lang,
      warningDistanceM,
      timestamp: Date.now(),
    });
  }

  // Receive AI result from RabbitMQ and relay to client via WebSocket
  async handleAIResult(result: any) {
    this.logger.log(
      `Received AI result for client ${result?.clientId} (userId: ${result?.userId ?? 'anonymous'})`,
    );

    // Persist to database
    try {
      const log = this.detectionLogRepo.create({
        userId: result.userId || null,
        action_type: result.taskType || result.task_type || 'UNKNOWN',
        result_text: result.text || '',
        confidence_score: result.confidence_score || null,
      });
      await this.detectionLogRepo.save(log);
      this.logger.log(`DetectionLog saved for client ${result.clientId}`);
    } catch (err) {
      this.logger.error(`Failed to save DetectionLog: ${err}`);
    }

    // Relay to client via WebSocket
    if (this.server) {
      this.server.to(result.clientId).emit('ai_result', {
        taskType: result.taskType || result.task_type,
        task_type: result.taskType || result.task_type,
        text: result.text,
        audio_url: result.audio_url,
        stable: result.stable,
        danger_alerts: result.danger_alerts || [],
      });

      // Emit separate danger_alert events for immediate mobile handling
      const dangerAlerts = result.danger_alerts || [];
      for (const alert of dangerAlerts) {
        this.server.to(result.clientId).emit('danger_alert', {
          level: alert.distance < 1.0 ? 'CRITICAL' : 'HIGH',
          label: alert.label,
          message: alert.message,
          distance: alert.distance,
          position: alert.position,
        });
      }
    }
  }

  // Cleanup: remove stale client entries (called on disconnect)
  cleanupClient(clientId: string) {
    this.clientLastFrame.delete(clientId);
  }
}
