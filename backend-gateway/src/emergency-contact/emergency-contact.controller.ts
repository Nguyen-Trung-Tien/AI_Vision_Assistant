import { Controller, Get, Post, Body, Put, Param, Delete, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { EmergencyContactService } from './emergency-contact.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('emergency-contacts')
export class EmergencyContactController {
  constructor(private readonly emergencyContactService: EmergencyContactService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateEmergencyContactDto) {
    // req.user.userId comes from JwtAuthGuard
    return this.emergencyContactService.create(req.user.userId, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.emergencyContactService.findAllByUser(req.user.userId);
  }

  @Get('admin/user/:userId')
  adminFindAllByUser(@Request() req, @Param('userId') userId: string) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.emergencyContactService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.emergencyContactService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateEmergencyContactDto) {
    return this.emergencyContactService.update(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.emergencyContactService.remove(id, req.user.userId);
  }
}
