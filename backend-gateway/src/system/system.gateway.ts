import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SystemService } from './system.service';
import { NotificationService } from '../notification/notification.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SystemGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SystemGateway.name);

  constructor(
    private readonly systemService: SystemService,
    private readonly notificationService: NotificationService,
  ) {}

  afterInit() {
    this.logger.log('System WebSocket Gateway initialized');
    this.notificationService.setServer(this.server);

    // Send metrics every 10 seconds to 'admin' room
    setInterval(() => {
      this.broadcastMetrics();
    }, 10000);
  }

  handleConnection(client: Socket) {
    // If client is admin (based on some logic or room join request)
    // For now, let's assume admins join the 'admin' room
    client.on('join_admin', async () => {
      await client.join('admin');
      this.logger.log(`Client ${client.id} joined admin room`);
    });
  }

  private broadcastMetrics() {
    if (this.server) {
      const metrics = this.systemService.getMetrics();
      // Add active connections count from the server engine
      const activeConnections = this.server.engine.clientsCount;

      this.server.to('admin').emit('system_metrics', {
        ...metrics,
        activeConnections,
      });
    }
  }
}
