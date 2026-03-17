import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import type { Request as ExpressRequest } from 'express';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends ExpressRequest {
  user: { sub: string };
}

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  private ensureAdmin(req: ExpressRequest) {
    const user = req.user as { role?: string } | undefined;
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('onlyWrong') onlyWrong = 'false',
  ) {
    return this.feedbackService.findAll(
      +page,
      +limit,
      onlyWrong === 'true' || onlyWrong === '1',
    );
  }

  @Get('stats')
  getStats() {
    return this.feedbackService.getStats();
  }

  @Get('export')
  exportDataset(@Request() req: ExpressRequest, @Res() res: Response) {
    this.ensureAdmin(req);
    return this.feedbackService.exportYoloDatasetZip(res);
  }

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body()
    body: {
      detectionId: string;
      isCorrect: boolean;
      correctLabel?: string;
      imageBase64?: string;
    },
  ) {
    return this.feedbackService.create(
      body.detectionId,
      req.user.sub,
      body.isCorrect,
      body.correctLabel,
      body.imageBase64,
    );
  }

  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() body: { correctLabel: string },
  ) {
    this.ensureAdmin(req);
    return this.feedbackService.review(id, req.user.sub, body.correctLabel);
  }
}
