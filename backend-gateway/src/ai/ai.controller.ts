import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('models')
  getModels() {
    return this.aiService.getModels();
  }

  @Patch('switch')
  @Roles(Role.SUPER_ADMIN)
  switchModel(@Body('modelId') modelId: string) {
    return this.aiService.switchModel(modelId);
  }

  @Get('analytics/accuracy')
  getAccuracyTrend(@Query('days') days: number) {
    return this.aiService.getAccuracyTrend(days || 7);
  }

  @Get('analytics/peak-hours')
  getPeakHours() {
    return this.aiService.getPeakHours();
  }

  @Get('logs')
  getLogs(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('actionType') actionType: string,
    @Query('modelVersion') modelVersion: string,
  ) {
    return this.aiService.getDetectionLogs(page || 1, limit || 20, {
      actionType,
      modelVersion,
    });
  }

  @Get('ota-model')
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  getOtaModel() {
    return this.aiService.getLatestOtaModel();
  }
}
