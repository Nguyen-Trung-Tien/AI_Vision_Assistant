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

interface AuthenticatedRequest extends Record<string, any> {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('face')
@UseGuards(JwtAuthGuard)
export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  @Post('register')
  register(
    @Request() req: AuthenticatedRequest,
    @Body() body: { name: string; frameData: string },
  ) {
    return this.faceService.registerFace(
      req.user.userId,
      body.name,
      body.frameData,
    );
  }

  @Get('list')
  async list(@Request() req: AuthenticatedRequest) {
    return await this.faceService.listFaces(req.user.userId);
  }

  @Delete(':id')
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return await this.faceService.deleteFace(id, req.user.userId);
  }
}
