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
import type { Request as ExpressRequest } from 'express';
import { SosService } from './sos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends ExpressRequest {
  user: { sub: string };
}

@Controller('sos')
@UseGuards(JwtAuthGuard)
export class SosController {
  constructor(private readonly sosService: SosService) {}

  private ensureAdmin(req: ExpressRequest) {
    const user = req.user as { role?: string } | undefined;
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.sosService.findAll(+page, +limit);
  }

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() body: { latitude: number; longitude: number; imageUrl?: string },
  ) {
    return this.sosService.createAlert(
      req.user.sub,
      body.latitude,
      body.longitude,
      body.imageUrl,
    );
  }

  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() body: { note?: string },
  ) {
    this.ensureAdmin(req);
    return this.sosService.resolve(id, req.user.sub, body.note);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string, @Request() req: AuthRequest) {
    this.ensureAdmin(req);
    return this.sosService.acknowledge(id);
  }
}
