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

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      // Client passes token via: socket.auth = { token: '...' }
      // or headers: { authorization: 'Bearer ...' }
      let token: string | undefined =
        typeof client.handshake.auth?.token === 'string'
          ? client.handshake.auth.token
          : typeof client.handshake.headers?.authorization === 'string'
            ? client.handshake.headers.authorization
            : undefined;
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
        (client.data as { user?: unknown }).user = {
          sub: 999,
          username: 'dev_user',
        };
        return true;
      }

      const payload = this.jwtService.verify<Record<string, unknown>>(token);
      (client.data as { user?: unknown }).user = payload; // Attach user to socket data
      return true;
    } catch (ex) {
      this.logger.error('WebSocket Auth Error: ', ex);
      throw new WsException('Unauthorized');
    }
  }
}
