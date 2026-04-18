import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SystemService } from './system.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://127.0.0.1:4200',
      'http://localhost:4200',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  },
})
export class SystemGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SystemGateway.name);

  constructor(private readonly systemService: SystemService) {}

  afterInit() {
    this.logger.log('System WebSocket Gateway initialized');
    // Send metrics every 10 seconds to 'admin' room
    setInterval(() => {
      this.broadcastMetrics();
    }, 10000);
  }

  private broadcastMetrics() {
    if (this.server) {
      const metrics = this.systemService.getMetrics();
      this.server.to('admin').emit('system_metrics', metrics);
    }
  }
}
