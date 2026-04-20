import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionLog } from './entities/detection-log.entity';
import { SosAlert } from '../sos/entities/sos-alert.entity';
import { VisionGateway } from './vision.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TaskQueueService } from './task-queue.service';
import { HeatmapService } from './heatmap.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { VisionController } from './vision.controller';
import { SosModule } from '../sos/sos.module';
import { BroadcastModule } from '../broadcast/broadcast.module';
import { FaceModule } from '../face/face.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DetectionLog, SosAlert]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
    ClientsModule.registerAsync([
      {
        name: 'AI_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') as string],
            queue: 'ai_tasks_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
    SosModule,
    BroadcastModule,
    FaceModule,
  ],
  controllers: [VisionController],
  providers: [VisionGateway, TaskQueueService, HeatmapService, WsJwtGuard],
  exports: [HeatmapService],
})
export class VisionModule {}
