import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private settingsRepo: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    await this.seedSettings();
  }

  private async seedSettings() {
    const defaults = [
      {
        key: 'AI_FPS_LIMIT',
        value: '2',
        description: 'Giới hạn số khung hình xử lý mỗi giây',
      },
      {
        key: 'AI_CONFIDENCE_THRESHOLD',
        value: '0.5',
        description: 'Ngưỡng tin cậy tối thiểu của model',
      },
      {
        key: 'MAX_SOS_RADIUS_KM',
        value: '10',
        description: 'Bán kính tối đa gửi thông báo SOS tới người tình nguyện',
      },
      {
        key: 'SYSTEM_MAINTENANCE',
        value: 'false',
        description: 'Chế độ bảo trì hệ thống',
      },
      {
        key: 'ACTIVE_AI_MODEL',
        value: 'v1.0.0',
        description: 'Phiên bản AI Model đang hoạt động',
      },
    ];

    for (const setting of defaults) {
      const exists = await this.settingsRepo.findOneBy({ key: setting.key });
      if (!exists) {
        await this.settingsRepo.save(this.settingsRepo.create(setting));
      }
    }
  }

  async getAll() {
    return this.settingsRepo.find();
  }

  async update(key: string, value: string) {
    const setting = await this.settingsRepo.findOneBy({ key });
    if (setting) {
      setting.value = value;
      return this.settingsRepo.save(setting);
    }
    return null;
  }

  async getByKey(key: string): Promise<string | null> {
    const setting = await this.settingsRepo.findOneBy({ key });
    return setting ? setting.value : null;
  }
}
