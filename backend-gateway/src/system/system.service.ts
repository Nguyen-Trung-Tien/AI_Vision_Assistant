import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import * as os from 'os';
import axios from 'axios';

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

    // Check AI Worker via HTTP (if available)
    try {
      const response = await axios.get('http://localhost:8000/health', {
        timeout: 2000,
      });
      if (response.status !== 200) {
        status.aiWorker = 'DOWN';
      }
    } catch {
      status.aiWorker = 'DOWN';
    }

    return status;
  }

  getMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate real CPU load (simplified for Windows/Linux)
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      cpu: {
        model: cpus[0].model,
        cores: cpus.length,
        loadAvg: loadAvg[0] || 0,
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
        arch: os.arch(),
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
