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

interface AuthRequest extends ExpressRequest {
  user: { sub: string };
}

@Controller('broadcast')
@UseGuards(JwtAuthGuard)
export class BroadcastController {
  constructor(
    private readonly broadcastService: BroadcastService,
    private readonly usersService: UsersService,
  ) {}

  private ensureAdmin(req: ExpressRequest) {
    const user = req.user as { role?: string } | undefined;
    if (user?.role !== 'ADMIN') {
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

    return this.broadcastService.sendBroadcast(
      req.user.sub,
      body.message,
      body.targetType ?? 'all',
      resolvedTargetIds,
      body.priority ?? 'normal',
    );
  }
}
