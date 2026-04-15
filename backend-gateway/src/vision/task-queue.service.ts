import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from 'socket.io';
import { DetectionLog } from './entities/detection-log.entity';

interface VisionTask {
  clientId: string;
  userId?: string;
  taskType: string;
  frameData: string;
  lang?: string;
  warningDistanceM?: number;
  latitude?: number;
  longitude?: number;
  question?: string;
  mode?: string;
  priority?: number;
  frameSeq?: number;
  timestamp?: number;
}

export interface AIResultPayload {
  clientId: string;
  userId?: string;
  taskType?: string;
  task_type?: string;
  frameSeq?: number;
  frame_seq?: number;
  text?: string;
  confidence_score?: number;
  audio_url?: string;
  stable?: boolean;
  latitude?: number;
  longitude?: number;
  danger_alerts?: {
    distance: number;
    label: string;
    message: string;
    position: string;
  }[];
}

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);
  private server!: Server;

  private taskQueue: VisionTask[] = [];
  private readonly latestContinuousByClient = new Map<string, VisionTask>();
  private readonly continuousInFlightClients = new Set<string>();
  private readonly continuousInFlightSince = new Map<string, number>();

  private clientLastFrame: Map<string, number> = new Map();
  private nonContinuousProcessedStreak = 0;

  private readonly MIN_FRAME_INTERVAL_MS = 500;
  private readonly CONTINUOUS_IN_FLIGHT_TIMEOUT_MS = 2500;

  constructor(
    @Inject('AI_SERVICE') private client: ClientProxy,
    @InjectRepository(DetectionLog)
    private detectionLogRepo: Repository<DetectionLog>,
  ) {
    setInterval(() => {
      this.processNextTask();
    }, 50);
  }

  setServer(server: Server) {
    this.server = server;
  }

  enqueueTask(task: VisionTask) {
    const normalizedTask: VisionTask = {
      ...task,
      mode:
        task.mode ?? (task.taskType === 'CONTINUOUS' ? 'continuous' : 'normal'),
      priority: task.priority ?? this.resolvePriority(task.taskType),
      timestamp: task.timestamp ?? Date.now(),
    };

    if (
      normalizedTask.mode === 'continuous' ||
      normalizedTask.taskType === 'CONTINUOUS'
    ) {
      this.latestContinuousByClient.set(
        normalizedTask.clientId,
        normalizedTask,
      );
      return;
    }

    this.taskQueue.push(normalizedTask);
    this.sortQueueByPriority();
  }

  private sortQueueByPriority() {
    this.taskQueue.sort((a, b) => {
      const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.timestamp ?? 0) - (b.timestamp ?? 0);
    });
  }

  private resolvePriority(taskType: string): number {
    if (taskType === 'SOS') return 10;
    if (taskType === 'CONTINUOUS') return 1;
    return 6;
  }

  processNextTask() {
    this.releaseExpiredContinuousInflight();

    let task: VisionTask | undefined;

    const hasQueuedTask = this.taskQueue.length > 0;
    const hasContinuousTask = this.latestContinuousByClient.size > 0;

    if (
      hasQueuedTask &&
      (!hasContinuousTask || this.nonContinuousProcessedStreak < 2)
    ) {
      this.sortQueueByPriority();
      task = this.taskQueue.shift();
      this.nonContinuousProcessedStreak += 1;
    } else if (hasContinuousTask) {
      for (const [
        clientId,
        continuousTask,
      ] of this.latestContinuousByClient.entries()) {
        if (this.continuousInFlightClients.has(clientId)) continue;
        this.latestContinuousByClient.delete(clientId);
        task = continuousTask;
        this.nonContinuousProcessedStreak = 0;
        break;
      }
    }

    if (!task) return;

    this.pushHeavyTask(
      task.clientId,
      task.userId,
      task.taskType,
      task.frameData,
      task.lang,
      task.warningDistanceM,
      task.latitude,
      task.longitude,
      task.question,
      task.mode,
      task.priority,
      task.frameSeq,
      task.timestamp,
    );
  }

  checkRateLimit(clientId: string, taskType: string): boolean {
    const now = Date.now();
    const lastFrame = this.clientLastFrame.get(clientId) || 0;

    const interval =
      taskType === 'CONTINUOUS' ? 120 : this.MIN_FRAME_INTERVAL_MS;

    if (now - lastFrame < interval) return false;

    this.clientLastFrame.set(clientId, now);
    return true;
  }

  pushHeavyTask(
    clientId: string,
    userId: string | undefined,
    taskType: string,
    frameData: string,
    lang: string = 'vi',
    warningDistanceM: number = 2.0,
    latitude?: number,
    longitude?: number,
    question?: string,
    mode: string = 'normal',
    priority = 5,
    frameSeq?: number,
    timestamp?: number,
  ) {
    this.logger.log(`Push ${taskType} -> RabbitMQ (client ${clientId})`);

    if (taskType === 'CONTINUOUS') {
      this.continuousInFlightClients.add(clientId);
      this.continuousInFlightSince.set(clientId, Date.now());
    }

    this.client.emit('process_ai_task', {
      clientId,
      userId,
      taskType: taskType === 'CONTINUOUS' ? 'CAPTION' : taskType,
      originalTaskType: taskType,
      mode,
      frameData,
      lang,
      warningDistanceM,
      latitude,
      longitude,
      question,
      timestamp: timestamp ?? Date.now(),
      priority,
      frameSeq,
    });
  }

  async handleAIResult(result: AIResultPayload) {
    try {
      const resultTaskType = result.taskType || result.task_type;
      if (resultTaskType === 'CONTINUOUS') {
        this.continuousInFlightClients.delete(result.clientId);
        this.continuousInFlightSince.delete(result.clientId);
      }

      const dangerAlerts = result.danger_alerts || [];

      const highestDangerDistance = dangerAlerts.reduce(
        (min, a) => Math.min(min, a.distance),
        Number.POSITIVE_INFINITY,
      );

      const log = this.detectionLogRepo.create({
        userId: result.userId || undefined,
        action_type: result.taskType || result.task_type || 'UNKNOWN',
        result_text: result.text || '',
        confidence_score: result.confidence_score || undefined,
        latitude: result.latitude,
        longitude: result.longitude,
        severity:
          dangerAlerts.length === 0
            ? undefined
            : highestDangerDistance < 1
              ? 'CRITICAL'
              : 'HIGH',
      });

      const savedLog = await this.detectionLogRepo.save(log);

      if (this.server) {
        this.server.to(result.clientId).emit('ai_result', {
          detectionId: savedLog.id,
          taskType: resultTaskType,
          frameSeq: result.frameSeq || result.frame_seq,
          text: result.text,
          audio_url: result.audio_url,
          stable: result.stable,
          danger_alerts: dangerAlerts,
        });
      }

      if (this.server) {
        for (const alert of dangerAlerts) {
          this.server.to(result.clientId).emit('danger_alert', {
            level: alert.distance < 1 ? 'CRITICAL' : 'HIGH',
            label: alert.label,
            message: alert.message,
            distance: alert.distance,
            position: alert.position,
          });
        }
      }
    } catch (err) {
      this.logger.error(`handleAIResult error: ${err}`);
    }
  }

  cleanupClient(clientId: string) {
    this.clientLastFrame.delete(clientId);
    this.latestContinuousByClient.delete(clientId);
    this.continuousInFlightClients.delete(clientId);
    this.continuousInFlightSince.delete(clientId);
    this.taskQueue = this.taskQueue.filter(
      (task) => task.clientId !== clientId,
    );
  }

  private releaseExpiredContinuousInflight() {
    const now = Date.now();
    for (const [
      clientId,
      startedAt,
    ] of this.continuousInFlightSince.entries()) {
      if (now - startedAt < this.CONTINUOUS_IN_FLIGHT_TIMEOUT_MS) continue;
      this.continuousInFlightSince.delete(clientId);
      this.continuousInFlightClients.delete(clientId);
    }
  }
}
