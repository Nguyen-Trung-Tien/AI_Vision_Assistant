import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  private ensureAdmin(req: Request) {
    const user = req.user as { role?: string } | undefined;
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('overview')
  async getOverview(@Req() req: Request) {
    this.ensureAdmin(req);
    return this.statsService.getOverview();
  }

  @Get('by-type')
  async getByType(@Req() req: Request) {
    this.ensureAdmin(req);
    return this.statsService.getByType();
  }

  @Get('by-day')
  async getByDay(@Req() req: Request, @Query('days') days?: string) {
    this.ensureAdmin(req);
    return this.statsService.getByDay(days ? parseInt(days, 10) : 30);
  }

  @Get('logs')
  async getLogs(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.ensureAdmin(req);
    return this.statsService.getLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
