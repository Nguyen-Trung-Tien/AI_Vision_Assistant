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

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller('broadcast')
@UseGuards(JwtAuthGuard)
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.broadcastService.findAll(+page, +limit);
  }

  @Post()
  send(
    @Request() req: AuthRequest,
    @Body()
    body: {
      message: string;
      targetType?: string;
      targetIds?: string[];
      priority?: string;
    },
  ) {
    return this.broadcastService.sendBroadcast(
      req.user.sub,
      body.message,
      body.targetType ?? 'all',
      body.targetIds ?? [],
      body.priority ?? 'normal',
    );
  }
}
