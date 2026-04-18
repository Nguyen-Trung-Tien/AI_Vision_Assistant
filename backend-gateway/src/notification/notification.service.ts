import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

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
  private notifications: Notification[] = [];
  private readonly logger = new Logger(NotificationService.name);
  private readonly MAX_NOTIFICATIONS = 100;

  setServer(server: Server) {
    this.server = server;
  }

  push(data: Omit<Notification, 'id' | 'read' | 'timestamp'>) {
    const notification: Notification = {
      id: Math.random().toString(36).substring(7),
      read: false,
      timestamp: new Date(),
      ...data,
    };

    this.notifications.unshift(notification);
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications.pop();
    }

    if (this.server) {
      this.server.to('admin').emit('admin_notification', notification);
    } else {
      this.logger.warn('WebSocket server not initialized in NotificationService');
    }

    return notification;
  }

  findAll() {
    return this.notifications;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

  clear() {
    this.notifications = [];
  }
}
