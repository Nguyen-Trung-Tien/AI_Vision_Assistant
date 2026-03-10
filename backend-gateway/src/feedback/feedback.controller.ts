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
} from '@nestjs/common';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

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
  exportDataset(@Res() res: Response) {
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
    return this.feedbackService.review(id, req.user.sub, body.correctLabel);
  }
}
