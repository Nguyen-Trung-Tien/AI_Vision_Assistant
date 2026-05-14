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
        key: 'ACTIVE_OBJECT_MODEL',
        value: 'object-v11m-best',
        description: 'Mô hình nhận diện vật thể',
      },
      {
        key: 'ACTIVE_MONEY_MODEL',
        value: 'money-v11m-best',
        description: 'Mô hình nhận diện tiền',
      },
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
        key: 'OBJECT_CLASSES',
        value:
          'bang_hieu,cau_thang,den_xanh,den_do,nap_cong,nguoi,o_ga,rao_chan,thung_rac,vach_qua_duong,xe_may,xe_dap,xe_lon',
        description: 'Nhận diện vật thể (13 classes)',
      },
      {
        key: 'CURRENCY_CLASSES',
        value: '1000,2000,5000,10000,20000,50000,100000,200000,500000',
        description: 'Nhận diện mệnh giá tiền (9 classes)',
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
    ];

    // Remove legacy key if it exists
    const legacyKey = await this.settingsRepo.findOneBy({
      key: 'ACTIVE_AI_MODEL',
    });
    if (legacyKey) {
      await this.settingsRepo.remove(legacyKey);
    }

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
