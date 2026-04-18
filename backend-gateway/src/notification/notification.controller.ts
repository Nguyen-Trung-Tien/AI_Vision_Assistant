import { Controller, Get, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll() {
    return this.notificationService.findAll();
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    this.notificationService.markAsRead(id);
    return { success: true };
  }

  @Patch('read-all')
  markAllAsRead() {
    this.notificationService.markAllAsRead();
    return { success: true };
  }

  @Delete()
  clear() {
    this.notificationService.clear();
    return { success: true };
  }
}
