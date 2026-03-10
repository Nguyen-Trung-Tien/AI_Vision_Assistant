import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Broadcast } from './entities/broadcast.entity';
import { Server } from 'socket.io';

@Injectable()
export class BroadcastService {
  private server: Server;

  constructor(
    @InjectRepository(Broadcast)
    private readonly broadcastRepo: Repository<Broadcast>,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async sendBroadcast(
    adminId: string,
    message: string,
    targetType: string = 'all',
    targetIds: string[] = [],
    priority: string = 'normal',
  ): Promise<Broadcast> {
    const broadcast = this.broadcastRepo.create({
      adminId,
      message,
      target_type: targetType,
      target_ids: targetIds.length > 0 ? targetIds : undefined,
      priority,
      sent_count: 0,
    });

    const saved = await this.broadcastRepo.save(broadcast);

    // Emit via WebSocket
    let sentCount = 0;
    if (this.server) {
      const payload = {
        broadcastId: saved.id,
        message,
        priority,
        sentAt: saved.created_at,
      };

      if (targetType === 'all') {
        this.server.to('users').emit('tts_broadcast', payload);
        sentCount = -1; // broadcast room size is not tracked server-side
      } else if (targetIds.length > 0) {
        // get sockets for specific users via room naming convention
        targetIds.forEach((uid) => {
          this.server.to(`user:${uid}`).emit('tts_broadcast', payload);
        });
        sentCount = targetIds.length;
      }
    }

    saved.sent_count = sentCount;
    await this.broadcastRepo.save(saved);
    return saved;
  }

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await this.broadcastRepo.findAndCount({
      relations: ['admin'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }
}
