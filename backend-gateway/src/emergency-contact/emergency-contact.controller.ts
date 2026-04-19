import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';

import { EmergencyContactService } from './emergency-contact.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('emergency-contacts')
export class EmergencyContactController {
  constructor(
    private readonly emergencyContactService: EmergencyContactService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() createDto: CreateEmergencyContactDto) {
    const user = (req as Request).user as JwtUser;
    return this.emergencyContactService.create(user.userId, createDto);
  }

  @Get()
  findAll(@Req() req: any) {
    const user = (req as Request).user as JwtUser;
    return this.emergencyContactService.findAllByUser(user.userId);
  }

  @Get('admin/user/:userId')
  adminFindAllByUser(@Req() req: any, @Param('userId') userId: string) {
    const user = (req as Request).user as JwtUser;
    if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return this.emergencyContactService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const user = (req as Request).user as JwtUser;
    return this.emergencyContactService.findOne(id, user.userId);
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateEmergencyContactDto,
  ) {
    const user = (req as Request).user as JwtUser;
    return this.emergencyContactService.update(id, user.userId, updateDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const user = (req as Request).user as JwtUser;
    return this.emergencyContactService.remove(id, user.userId);
  }
}
