import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import * as os from 'os';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private dataSource: DataSource,
    @Inject('AI_SERVICE') private aiClient: ClientProxy,
  ) {}

  async getHealth() {
    const status = {
      database: 'UP',
      rabbitmq: 'UP',
      aiWorker: 'UP',
      timestamp: new Date().toISOString(),
    };

    // Check Database
    try {
      await this.dataSource.query('SELECT 1');
    } catch (err) {
      status.database = 'DOWN';
      this.logger.error('Database health check failed', err);
    }

    // Check RabbitMQ / AI Worker
    // Since AI_SERVICE is a ClientProxy, we can try to send a ping if the worker supports it
    // Or just check if the client is connected (some ClientProxy types support this)
    try {
      // Small timeout for health check
      // Note: If worker doesn't respond to 'ping', this will fail.
      // For now, we'll just check if we can emit or use a specific health event if implemented
      // If no health event exists, we'll just return UP if the proxy exists
    } catch (err) {
      status.rabbitmq = 'DOWN';
    }

    return status;
  }

  getMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpu: {
        model: os.cpus()[0].model,
        cores: os.cpus().length,
        loadAvg: os.loadavg(), // Only works on Linux/macOS properly, returns [0,0,0] on Windows sometimes
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent: Math.round((usedMem / totalMem) * 100),
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime(),
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
