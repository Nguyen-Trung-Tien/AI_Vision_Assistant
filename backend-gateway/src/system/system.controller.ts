import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { Body, Patch, Param } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('health')
  getHealth() {
    return this.systemService.getHealth();
  }

  @Get('metrics')
  getMetrics() {
    return this.systemService.getMetrics();
  }

  @Get('settings')
  getSettings() {
    return this.settingsService.getAll();
  }

  @Patch('settings/:key')
  updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.update(key, value);
  }
}
