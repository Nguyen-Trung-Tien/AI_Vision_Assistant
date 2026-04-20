import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

import { SkipMaintenance } from './common/decorators/skip-maintenance.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipMaintenance()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
