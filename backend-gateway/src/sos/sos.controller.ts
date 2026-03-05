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
import { SosService } from './sos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller('sos')
@UseGuards(JwtAuthGuard)
export class SosController {
  constructor(private readonly sosService: SosService) {}

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
    return this.sosService.resolve(id, req.user.sub, body.note);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.sosService.acknowledge(id);
  }
}
