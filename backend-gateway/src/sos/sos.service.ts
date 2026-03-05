import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SosAlert } from './entities/sos-alert.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SosService {
  constructor(
    @InjectRepository(SosAlert)
    private readonly sosRepo: Repository<SosAlert>,
  ) {}

  async createAlert(
    userId: string,
    latitude: number,
    longitude: number,
    imageUrl?: string,
  ): Promise<SosAlert> {
    const alert = this.sosRepo.create({
      userId,
      latitude,
      longitude,
      image_url: imageUrl,
      status: 'pending',
    });
    return this.sosRepo.save(alert);
  }

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await this.sosRepo.findAndCount({
      relations: ['user', 'handledBy'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async resolve(id: string, adminId: string, note?: string): Promise<SosAlert> {
    const alert = await this.sosRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException(`SOS alert #${id} not found`);

    alert.status = 'resolved';
    alert.handledBy = { id: adminId } as User;
    alert.note = note ?? '';
    alert.resolved_at = new Date();
    return this.sosRepo.save(alert);
  }

  async acknowledge(id: string): Promise<SosAlert> {
    const alert = await this.sosRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException(`SOS alert #${id} not found`);

    alert.status = 'acknowledged';
    return this.sosRepo.save(alert);
  }
}
