import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FaceService } from './face.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('face')
@UseGuards(JwtAuthGuard)
export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  @Post('register')
  async register(@Request() req, @Body() body: { name: string; frameData: string }) {
    return this.faceService.registerFace(req.user.userId, body.name, body.frameData);
  }

  @Get('list')
  async list(@Request() req) {
    return this.faceService.listFaces(req.user.userId);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.faceService.deleteFace(id, req.user.userId);
  }
}
