import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { BroadcastService } from './broadcast.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { AuditService } from '../audit/audit.service';

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('broadcast')
@UseGuards(JwtAuthGuard)
export class BroadcastController {
  constructor(
    private readonly broadcastService: BroadcastService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  private ensureAdmin(req: ExpressRequest) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get()
  findAll(
    @Request() req: ExpressRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    this.ensureAdmin(req);
    return this.broadcastService.findAll(+page, +limit);
  }

  @Post()
  async send(
    @Request() req: AuthRequest,
    @Body()
    body: {
      message: string;
      targetType?: string;
      targetIds?: string[];
      priority?: string;
    },
  ) {
    this.ensureAdmin(req);
    const rawTargets = body.targetIds ?? [];
    let resolvedTargetIds = rawTargets;

    if ((body.targetType ?? 'all') === 'specific' && rawTargets.length > 0) {
      const maybeEmails = rawTargets.filter((v) => v.includes('@'));
      if (maybeEmails.length > 0) {
        const users = await Promise.all(
          maybeEmails.map((email) => this.usersService.findOneByEmail(email)),
        );
        resolvedTargetIds = users
          .filter((u): u is NonNullable<typeof u> => Boolean(u))
          .map((u) => u.id);
      }
    }

    const result = await this.broadcastService.sendBroadcast(
      req.user.userId,
      body.message,
      body.targetType ?? 'all',
      resolvedTargetIds,
      body.priority ?? 'normal',
    );

    await this.auditService.log({
      adminId: req.user.userId,
      action: 'SEND_BROADCAST',
      targetType: 'broadcast',
      targetId: (result as any).id,
      details: {
        message: body.message,
        targetType: body.targetType,
        targetCount: resolvedTargetIds.length,
      },
      ipAddress: req.ip,
    });

    return result;
  }
}
