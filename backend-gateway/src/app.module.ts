import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { DetectionLog } from './vision/entities/detection-log.entity';
import { SosAlert } from './sos/entities/sos-alert.entity';
import { AiFeedback } from './feedback/entities/ai-feedback.entity';
import { Broadcast } from './broadcast/entities/broadcast.entity';
import { UserSession } from './users/entities/user-session.entity';
import { AuthModule } from './auth/auth.module';
import { VisionModule } from './vision/vision.module';
import { StatsModule } from './stats/stats.module';
import { SosModule } from './sos/sos.module';
import { FeedbackModule } from './feedback/feedback.module';
import { BroadcastModule } from './broadcast/broadcast.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          User,
          DetectionLog,
          SosAlert,
          AiFeedback,
          Broadcast,
          UserSession,
        ],
        synchronize: configService.get<string>('DB_SYNC', 'false') === 'true',
      }),
    }),
    AuthModule,
    VisionModule,
    StatsModule,
    SosModule,
    FeedbackModule,
    BroadcastModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
