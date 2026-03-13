import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { TaskQueueService } from './task-queue.service';
import { FrameStreamDto } from './dto/frame-stream.dto';
import { SosService } from '../sos/sos.service';
import { BroadcastService } from '../broadcast/broadcast.service';

interface AuthSocket extends Socket {
  data: {
    user?: { sub?: string | number };
  };
}

@WebSocketGateway({ cors: { origin: '*' } })
export class VisionGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VisionGateway.name);

  constructor(
    private readonly taskQueueService: TaskQueueService,
    private readonly sosService: SosService,
    private readonly broadcastService: BroadcastService,
  ) {}

  afterInit(server: Server) {
    this.taskQueueService.setServer(server);
    this.broadcastService.setServer(server);
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
  handleFrameStream(
    @MessageBody() data: FrameStreamDto,
    @ConnectedSocket() client: AuthSocket,
  ) {
    const userId = client.data?.user?.sub?.toString();

    // Rate limiting: max 2 frames/second per client
    if (!this.taskQueueService.checkRateLimit(client.id)) {
      client.emit('stream_ack', { status: 'throttled', timestamp: Date.now() });
      return;
    }

    if (data.task_type) {
      this.taskQueueService.pushHeavyTask(
        client.id,
        userId,
        data.task_type,
        data.frame,
        data.lang ?? 'vi',
        data.warning_distance_m ?? 2.0,
        data.latitude,
        data.longitude,
      );
    }

    client.emit('stream_ack', { status: 'received', timestamp: Date.now() });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('visual_qa')
  handleVisualQA(
    @MessageBody() data: FrameStreamDto,
    @ConnectedSocket() client: AuthSocket,
  ) {
    const userId = client.data?.user?.sub?.toString();

    // Check rate limit if needed, skip for now since it's user-triggered

    this.taskQueueService.pushHeavyTask(
      client.id,
      userId,
      'visual_qa',
      data.frame,
      data.lang ?? 'vi',
      2.0,
      data.latitude,
      data.longitude,
      data.question,
    );

    client.emit('visual_qa_ack', { status: 'received', timestamp: Date.now() });
  }

  /**
   * SOS Alert: User gửi sự kiện khẩn cấp
   * Payload: { latitude, longitude, imageBase64? }
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sos_alert')
  async handleSosAlert(
    @MessageBody()
    data: { latitude: number; longitude: number; imageBase64?: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const userId = client.data?.user?.sub?.toString();
    this.logger.warn(`SOS Alert received from user ${userId ?? 'unknown'}`);

    const savedAlert = await this.sosService.createAlert(
      userId ?? null,
      data.latitude,
      data.longitude,
      data.imageBase64
        ? `data:image/jpeg;base64,${data.imageBase64}`
        : undefined,
    );

    // Broadcast to all admins in room 'admin'
    this.server.to('admin').emit('sos_incoming', {
      sosId: savedAlert.id,
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      imageBase64: data.imageBase64,
      timestamp: new Date().toISOString(),
    });

    client.emit('sos_ack', { status: 'received', timestamp: Date.now() });
  }

  /**
   * Admin join: admin vào room để nhận SOS và broadcasts
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_admin')
  handleJoinAdmin(@ConnectedSocket() client: AuthSocket) {
    void client.join('admin');
    this.logger.log(`Admin joined admin room: ${client.id}`);
    client.emit('join_admin_ack', { status: 'ok' });
  }

  /**
   * User join: user vào room riêng để nhận broadcast TTS
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_user')
  handleJoinUser(@ConnectedSocket() client: AuthSocket) {
    const userId = client.data?.user?.sub?.toString();
    if (userId) {
      void client.join(`user:${userId}`);
      void client.join('users');
    }
    client.emit('join_user_ack', { status: 'ok' });
  }
}
