import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { User } from '../users/entities/user.entity';
import { SosAlert } from '../sos/entities/sos-alert.entity';
import { DetectionLog } from '../vision/entities/detection-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SosAlert, DetectionLog])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
