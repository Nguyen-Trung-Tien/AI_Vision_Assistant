import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('report')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('users')
  async downloadUsers(@Res() res: Response) {
    const csv = await this.reportService.exportUsers();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="users_report.csv"',
    });
    return res.send(csv);
  }

  @Get('sos')
  async downloadSos(@Res() res: Response) {
    const csv = await this.reportService.exportSosHistory();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sos_report.csv"',
    });
    return res.send(csv);
  }

  @Get('activity')
  async downloadActivity(@Res() res: Response) {
    const csv = await this.reportService.exportActivityLogs();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="activity_report.csv"',
    });
    return res.send(csv);
  }
}
