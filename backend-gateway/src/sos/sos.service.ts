import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SosAlert } from './entities/sos-alert.entity';
import { User } from '../users/entities/user.entity';
import { SmsService } from '../sms/sms.service';
import { EmergencyContactService } from '../emergency-contact/emergency-contact.service';

@Injectable()
export class SosService {
  constructor(
    @InjectRepository(SosAlert)
    private readonly sosRepo: Repository<SosAlert>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly smsService: SmsService,
    private readonly emergencyContactService: EmergencyContactService,
  ) {}

  async createAlert(
    userId: string | null,
    latitude: number,
    longitude: number,
    imageUrl?: string,
  ): Promise<SosAlert> {
    const alert = this.sosRepo.create({
      userId: userId || null,
      latitude,
      longitude,
      image_url: imageUrl,
      status: 'pending',
    });

    const savedAlert = await this.sosRepo.save(alert);

    // Trigger SMS to emergency contacts asynchronously
    if (userId) {
      this.sendEmergencySms(userId, latitude, longitude).catch((err) => {
        console.error('Failed to send emergency SMS:', err);
      });
    }

    return savedAlert;
  }

  private async sendEmergencySms(userId: string, lat: number, lng: number) {
    const contacts =
      await this.emergencyContactService.findAllSosContactsByUserId(userId);
    if (!contacts || contacts.length === 0) return;

    let userName = 'Người dùng';
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user && user.full_name) {
        userName = user.full_name;
      }
    } catch (error) {
      console.error('Failed to fetch user name for SMS:', error);
    }

    // In production we should limit concurrent SMS sends or use a queue
    for (const contact of contacts) {
      await this.smsService.sendSOS(contact.phone, userName, lat, lng);
    }
  }

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await this.sosRepo.findAndCount({
      relations: ['user', 'user.emergencyContacts', 'handledBy'],
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

  async getEmergencyContactsByUser(userId: string) {
    return this.emergencyContactService.findAllByUser(userId);
  }

  async findAlertWithUser(alertId: string): Promise<SosAlert | null> {
    return this.sosRepo.findOne({
      where: { id: alertId },
      relations: ['user'],
    });
  }
}
