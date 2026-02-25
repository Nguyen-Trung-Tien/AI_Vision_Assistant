import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      // Client passes token via: socket.auth = { token: '...' }
      // or headers: { authorization: 'Bearer ...' }
      let token =
        client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
      if (!token) {
        throw new WsException('Unauthorized Access');
      }

      // Dev bypass token — only enabled when NODE_ENV !== 'production'
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      if (nodeEnv !== 'production' && token === 'dev_bypass_token') {
        this.logger.warn('Dev bypass token used — disable in production!');
        client.data.user = { sub: 999, username: 'dev_user' };
        return true;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload; // Attach user to socket data
      return true;
    } catch (ex) {
      this.logger.error('WebSocket Auth Error: ', ex);
      throw new WsException('Unauthorized');
    }
  }
}
