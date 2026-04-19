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
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { AuditService } from '../audit/audit.service';

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('sos')
@UseGuards(JwtAuthGuard)
export class SosController {
  constructor(
    private readonly sosService: SosService,
    private readonly auditService: AuditService,
  ) {}

  private ensureAdmin(req: ExpressRequest) {
    if (req.user?.role !== 'ADMIN') {
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
      req.user.userId,
      body.latitude,
      body.longitude,
      body.imageUrl,
    );
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() body: { note?: string },
  ) {
    this.ensureAdmin(req);
    const result = await this.sosService.resolve(
      id,
      req.user.userId,
      body.note,
    );

    await this.auditService.log({
      adminId: req.user.userId,
      action: 'RESOLVE_SOS',
      targetType: 'sos',
      targetId: id,
      details: { note: body.note },
      ipAddress: req.ip,
    });

    return result;
  }

  @Patch(':id/acknowledge')
  async acknowledge(@Param('id') id: string, @Request() req: AuthRequest) {
    this.ensureAdmin(req);
    const result = await this.sosService.acknowledge(id);

    await this.auditService.log({
      adminId: req.user.userId,
      action: 'ACKNOWLEDGE_SOS',
      targetType: 'sos',
      targetId: id,
      ipAddress: req.ip,
    });

    return result;
  }
}
