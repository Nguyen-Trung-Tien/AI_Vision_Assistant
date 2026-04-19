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
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Role } from '../common/enums/role.enum';

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  private ensureAdmin(req: ExpressRequest) {
    const user = req.user as JwtUser | undefined;
    if (
      user?.role !== Role.ADMIN &&
      user?.role !== Role.SUPER_ADMIN &&
      user?.role !== Role.MODERATOR
    ) {
      throw new ForbiddenException('Insufficient permissions');
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
      req.user.userId,
      body.isCorrect,
      body.correctLabel,
      body.imageBase64,
    );
  }

  @Get(':id/suggest')
  suggestLabel(@Param('id') id: string, @Request() req: ExpressRequest) {
    this.ensureAdmin(req);
    return this.feedbackService.suggestLabel(id);
  }

  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() body: { correctLabel: string },
  ) {
    this.ensureAdmin(req);
    return this.feedbackService.review(id, req.user.userId, body.correctLabel);
  }

  @Post('bulk-delete')
  deleteBulk(@Request() req: ExpressRequest, @Body() body: { ids: string[] }) {
    this.ensureAdmin(req);
    return this.feedbackService.removeBulk(body.ids);
  }

  @Post('clear-all')
  deleteAll(
    @Request() req: ExpressRequest,
    @Query('onlyWrong') onlyWrong = 'false',
  ) {
    this.ensureAdmin(req);
    return this.feedbackService.removeAll(
      onlyWrong === 'true' || onlyWrong === '1',
    );
  }

  @Post(':id/delete')
  delete(@Param('id') id: string, @Request() req: ExpressRequest) {
    this.ensureAdmin(req);
    return this.feedbackService.remove(id);
  }
}
