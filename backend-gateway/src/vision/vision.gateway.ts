import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { TaskQueueService } from './task-queue.service';
import { FrameStreamDto } from './dto/frame-stream.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class VisionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VisionGateway.name);

  constructor(private readonly taskQueueService: TaskQueueService) {}

  afterInit(server: Server) {
    this.taskQueueService.setServer(server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.taskQueueService.cleanupClient(client.id);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('frame_stream')
  async handleFrameStream(
    @MessageBody() data: FrameStreamDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.sub?.toString();

    // Rate limiting: max 2 frames/second per client
    if (!this.taskQueueService.checkRateLimit(client.id)) {
      client.emit('stream_ack', { status: 'throttled', timestamp: Date.now() });
      return;
    }

    if (data.task_type) {
      await this.taskQueueService.pushHeavyTask(
        client.id,
        userId,
        data.task_type,
        data.frame,
        data.lang ?? 'vi',
        data.warning_distance_m ?? 2.0,
      );
    }

    client.emit('stream_ack', { status: 'received', timestamp: Date.now() });
  }
}
