import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';

export interface Notification {
  id: string;
  type: 'sos' | 'feedback' | 'user' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  link?: string;
}

@Injectable()
export class NotificationService {
  private server: Server;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server linked to NotificationService');
  }

  async push(data: Omit<Notification, 'id' | 'read' | 'timestamp'>) {
    const notification = this.notificationRepo.create({
      ...data,
      read: false,
    });

    const saved = await this.notificationRepo.save(notification);

    if (this.server) {
      this.server.to('admin').emit('admin_notification', saved);
    } else {
      this.logger.warn(
        'WebSocket server not initialized in NotificationService',
      );
    }

    return saved;
  }

  async findAll() {
    try {
      return await this.notificationRepo.find({
        order: { timestamp: 'DESC' },
        take: 50,
      });
    } catch (err) {
      this.logger.error('Failed to fetch notifications:', err);
      throw err;
    }
  }

  async markAsRead(id: string) {
    await this.notificationRepo.update(id, { read: true });
  }

  async markAllAsRead() {
    await this.notificationRepo.update({ read: false }, { read: true });
  }

  async clear() {
    await this.notificationRepo.clear();
  }
}
