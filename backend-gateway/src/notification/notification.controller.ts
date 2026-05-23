import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
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
  async markAsRead(@Param('id') id: string) {
    await this.notificationService.markAsRead(id);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead() {
    await this.notificationService.markAllAsRead();
    return { success: true };
  }

  @Delete('all')
  async clear() {
    await this.notificationService.clear();
    return { success: true };
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    await this.notificationService.deleteOne(id);
    return { success: true };
  }

  @Post('bulk-delete')
  async deleteBulk(@Body() body: { ids: string[] }) {
    await this.notificationService.deleteBulk(body.ids);
    return { success: true };
  }
}
