import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaceRegistration } from './entities/face-registration.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class FaceService {
  constructor(
    @InjectRepository(FaceRegistration)
    private faceRepo: Repository<FaceRegistration>,
    @Inject('AI_SERVICE') private aiClient: ClientProxy,
  ) {}

  private readonly logger = new Logger(FaceService.name);

  registerFace(userId: string, name: string, frameData: string) {
    this.logger.log(
      `Received face registration request for user ${userId}, name: ${name}`,
    );

    try {
      this.aiClient.emit('process_ai_task', {
        clientId: `user:${userId}`,
        userId,
        taskType: 'GET_FACE_ENCODING',
        originalTaskType: 'GET_FACE_ENCODING',
        name,
        frameData,
        lang: 'vi',
        priority: 8,
        timestamp: Date.now(),
      });
      this.logger.log(
        `Task GET_FACE_ENCODING for ${name} emitted to RabbitMQ queue 'ai_tasks_queue'`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error emitting face registration task: ${errorMessage}`,
      );
      throw error;
    }

    this.logger.log(
      `Successfully initiated registration process for ${name} (User: ${userId})`,
    );
    return {
      success: true,
      message:
        'Đang xử lý đăng ký khuôn mặt cho ' + name + '. Vui lòng chờ xác nhận.',
    };
  }

  async listFaces(userId: string) {
    return this.faceRepo.find({ where: { userId } });
  }

  async deleteFace(id: string, userId: string) {
    return this.faceRepo.delete({ id, userId });
  }

  async saveEncoding(userId: string, name: string, encoding: number[]) {
    const registration = this.faceRepo.create({
      userId,
      name,
      encoding,
    });
    return this.faceRepo.save(registration);
  }
}
