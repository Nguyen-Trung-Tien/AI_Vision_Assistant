import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { SettingsService } from '../../system/settings.service';
import { SKIP_MAINTENANCE_KEY } from '../decorators/skip-maintenance.decorator';
import { Role } from '../enums/role.enum';

interface MaintenanceUser {
  userId: string;
  email: string;
  role: Role;
}

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked to skip maintenance check
    const skipMaintenance = this.reflector.getAllAndOverride<boolean>(
      SKIP_MAINTENANCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipMaintenance) {
      return true;
    }

    // Check if maintenance mode is active
    const isMaintenance =
      await this.settingsService.getByKey('SYSTEM_MAINTENANCE');

    if (isMaintenance !== 'true') {
      return true;
    }

    // If maintenance is on, allow only ADMIN or SUPER_ADMIN
    const request = context.switchToHttp().getRequest<Request>();
    let user = request.user as MaintenanceUser | undefined;

    // If request.user is missing (because Passport hasn't run yet),
    // try to manually verify the JWT token
    if (!user) {
      const token = this.extractToken(request);
      if (token) {
        try {
          const secret = this.configService.get<string>('JWT_SECRET');
          const payload = this.jwtService.verify<{
            sub: string;
            email: string;
            role: Role;
          }>(token, {
            secret,
          });

          if (payload) {
            user = {
              userId: payload.sub,
              email: payload.email,
              role: payload.role,
            };
          }
        } catch {
          // Token invalid or expired, proceed with blocking
        }
      }
    }

    if (user && (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN)) {
      return true;
    }

    // Otherwise, block the request
    throw new ServiceUnavailableException({
      statusCode: 503,
      message: 'Hệ thống đang bảo trì để nâng cấp. Vui lòng quay lại sau.',
      error: 'Service Unavailable',
    });
  }

  private extractToken(req: Request): string | null {
    // 1. Check cookies (for web dashboard)
    const cookie = (req.cookies as Record<string, string> | undefined)?.[
      'access_token'
    ];
    if (cookie) return cookie;

    // 2. Check Authorization header (for mobile app)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
