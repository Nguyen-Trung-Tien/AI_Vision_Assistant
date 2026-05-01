import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from 'socket.io';
import { DetectionLog } from './entities/detection-log.entity';
import { FaceService } from '../face/face.service';

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
  isFrontCamera?: boolean;
  subMode?: string;
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
  encoding?: number[];
  name?: string;
  knownFaces?: { name: string; embedding: number[] }[];
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
    private faceService: FaceService,
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

  async processNextTask() {
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

    await this.pushHeavyTask(
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
      task.isFrontCamera,
      task.subMode,
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

  async pushHeavyTask(
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
    isFrontCamera?: boolean,
    subMode?: string,
    timestamp?: number,
  ) {
    this.logger.log(`Push ${taskType} -> RabbitMQ (client ${clientId})`);

    let knownFaces: { name: string; embedding: number[] }[] = [];
    if (
      (taskType === 'FACE_RECOGNITION' ||
        (taskType === 'CONTINUOUS' && subMode === 'recognition')) &&
      userId
    ) {
      const faces = await this.faceService.listFaces(userId);
      knownFaces = faces.map((f) => ({ name: f.name, embedding: f.encoding }));
    }

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
      isFrontCamera,
      subMode,
      knownFaces, // Added for AI Worker
    });
  }

  async handleAIResult(result: AIResultPayload) {
    try {
      const resultTaskType = result.taskType || result.task_type;
      if (resultTaskType === 'CONTINUOUS') {
        this.continuousInFlightClients.delete(result.clientId);
        this.continuousInFlightSince.delete(result.clientId);
      }

      // Handle custom TaskType: GET_FACE_ENCODING result (Face Registration)
      if (resultTaskType === 'GET_FACE_ENCODING') {
        const name = result.name || 'Unknown Face';

        if (result.encoding && result.userId) {
          this.logger.log(
            `AI found face encoding for user ${result.userId} (Name: ${name}). Saving to DB...`,
          );
          try {
            await this.faceService.saveEncoding(
              result.userId,
              name,
              result.encoding,
            );
            this.logger.log(`Successfully saved face registration for ${name}`);

            if (this.server) {
              // Notify the user via the clientId room
              this.server.to(result.clientId).emit('face_registered', {
                success: true,
                name: name,
              });
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Failed to save face encoding to DB: ${errorMessage}`,
            );
            if (this.server) {
              this.server.to(result.clientId).emit('face_registered', {
                success: false,
                message: 'Internal server error saving face',
              });
            }
          }
        } else {
          this.logger.warn(
            `AI Worker could not detect a face for registration (User: ${result.userId}, Name: ${name})`,
          );
          if (this.server) {
            this.server.to(result.clientId).emit('face_registered', {
              success: false,
              message: result.text || 'Không tìm thấy khuôn mặt trong ảnh',
            });
          }
        }
        return;
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
