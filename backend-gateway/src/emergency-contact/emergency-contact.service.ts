import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';

@Injectable()
export class EmergencyContactService {
  constructor(
    @InjectRepository(EmergencyContact)
    private readonly contactRepo: Repository<EmergencyContact>,
  ) {}

  async create(userId: string, createDto: CreateEmergencyContactDto): Promise<EmergencyContact> {
    const contact = this.contactRepo.create({
      ...createDto,
      user_id: userId,
    });
    return this.contactRepo.save(contact);
  }

  async findAllByUser(userId: string): Promise<EmergencyContact[]> {
    return this.contactRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<EmergencyContact> {
    const contact = await this.contactRepo.findOne({
      where: { id, user_id: userId },
    });
    if (!contact) {
      throw new NotFoundException(`Emergency contact #${id} not found`);
    }
    return contact;
  }

  async update(id: string, userId: string, updateDto: UpdateEmergencyContactDto): Promise<EmergencyContact> {
    const contact = await this.findOne(id, userId);
    Object.assign(contact, updateDto);
    return this.contactRepo.save(contact);
  }

  async remove(id: string, userId: string): Promise<void> {
    const contact = await this.findOne(id, userId);
    await this.contactRepo.remove(contact);
  }

  async findAllSosContactsByUserId(userId: string): Promise<EmergencyContact[]> {
    // Finds contacts for a user specifically for SOS notifications
    return this.contactRepo.find({
      where: { user_id: userId, notify_sms: true },
    });
  }
}
