import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Read from httpOnly cookie first, fall back to Bearer header (for mobile app)
function fromCookieOrBearer(req: Request): string | null {
  const cookie = (req.cookies as Record<string, string> | undefined)?.[
    'access_token'
  ];
  if (cookie) return cookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: fromCookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret',
      passReqToCallback: false,
    });
  }

  validate(payload: { sub: string; email: string; role: string }) {
    // payload is the decoded token data (e.g. { sub: user.id, email: user.email })
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
