import { Controller, Logger, Get, Query, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TaskQueueService } from './task-queue.service';
import { HeatmapService } from './heatmap.service';
import type { AIResultPayload } from './task-queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class VisionController {
  private readonly logger = new Logger(VisionController.name);

  constructor(
    private readonly taskQueueService: TaskQueueService,
    private readonly heatmapService: HeatmapService,
  ) {}

  @EventPattern('ai_results_queue')
  async handleAIResult(@Payload() data: AIResultPayload) {
    this.logger.log(
      `Received final AI result from Python for client: ${data?.clientId}`,
    );
    await this.taskQueueService.handleAIResult(data);
  }

  @Get('detections/heatmap')
  @UseGuards(JwtAuthGuard)
  async getHeatmap(
    @Query('type') type: string = 'danger',
    @Query('days') days: string = '30',
  ) {
    return this.heatmapService.getHeatmapData(type, parseInt(days, 10));
  }
}
