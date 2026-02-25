import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  async getOverview() {
    return this.statsService.getOverview();
  }

  @Get('by-type')
  async getByType() {
    return this.statsService.getByType();
  }

  @Get('by-day')
  async getByDay(@Query('days') days?: string) {
    return this.statsService.getByDay(days ? parseInt(days, 10) : 30);
  }

  @Get('logs')
  async getLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.statsService.getLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
