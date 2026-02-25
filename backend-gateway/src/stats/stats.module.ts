import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionLog } from '../vision/entities/detection-log.entity';
import { User } from '../users/entities/user.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DetectionLog, User]), AuthModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
