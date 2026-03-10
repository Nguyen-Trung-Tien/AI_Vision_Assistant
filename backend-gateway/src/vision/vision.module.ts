import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionLog } from './entities/detection-log.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([DetectionLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
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
  ],
  controllers: [VisionController],
  providers: [VisionGateway, TaskQueueService, HeatmapService, WsJwtGuard],
  exports: [HeatmapService],
})
export class VisionModule {}
