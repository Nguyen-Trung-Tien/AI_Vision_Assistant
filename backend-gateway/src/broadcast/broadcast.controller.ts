import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller('broadcast')
@UseGuards(JwtAuthGuard)
export class BroadcastController {
  constructor(
    private readonly broadcastService: BroadcastService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
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
