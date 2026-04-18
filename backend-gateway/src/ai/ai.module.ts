import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionLog } from '../vision/entities/detection-log.entity';
import { AiFeedback } from '../feedback/entities/ai-feedback.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DetectionLog, AiFeedback]),
    SystemModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
