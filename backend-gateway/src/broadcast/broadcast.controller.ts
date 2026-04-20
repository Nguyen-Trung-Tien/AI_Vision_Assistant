import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
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
import { Role } from '../common/enums/role.enum';

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
    const user = req.user as JwtUser | undefined;
    if (user?.role !== Role.ADMIN && user?.role !== Role.SUPER_ADMIN) {
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
      targetId: result.id,
      details: {
        message: body.message,
        targetType: body.targetType,
        targetCount: resolvedTargetIds.length,
      },
      ipAddress: req.ip,
    });

    return result;
  }

  @Delete(':id')
  async remove(@Request() req: AuthRequest, @Param('id') id: string) {
    this.ensureAdmin(req);
    const success = await this.broadcastService.remove(id);

    if (success) {
      await this.auditService.log({
        adminId: req.user.userId,
        action: 'DELETE_BROADCAST',
        targetType: 'broadcast',
        targetId: id,
        details: { id },
        ipAddress: req.ip,
      });
    }
    return { success };
  }

  @Post('bulk-delete')
  async removeMany(@Request() req: AuthRequest, @Body('ids') ids: string[]) {
    this.ensureAdmin(req);
    const affected = await this.broadcastService.removeMany(ids);

    await this.auditService.log({
      adminId: req.user.userId,
      action: 'BULK_DELETE_BROADCAST',
      targetType: 'broadcast',
      targetId: 'multiple',
      details: { count: affected, ids },
      ipAddress: req.ip,
    });

    return { success: true, affected };
  }
}
