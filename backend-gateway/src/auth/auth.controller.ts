import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

type ValidatedUser = Record<string, unknown>;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('admin/login')
  async adminLogin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user: ValidatedUser | null = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) throw new UnauthorizedException('Admin credentials required');
    if (user['__locked'])
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    if (user['role'] !== 'ADMIN')
      throw new UnauthorizedException('Admin credentials required');

    const result = this.authService.login(
      user as {
        id: string;
        email: string;
        role: string;
        accessibility_prefs: Record<string, unknown>;
      },
    );

    // Set httpOnly cookie — JS cannot read this
    res.cookie('access_token', result.access_token, COOKIE_OPTIONS);

    // Return user info (but NOT the raw token)
    return { user: result.user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user: ValidatedUser | null = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (user['__locked'])
      throw new UnauthorizedException('Tài khoản đã bị khoá bởi admin');

    const result = this.authService.login(
      user as {
        id: string;
        email: string;
        role: string;
        accessibility_prefs: Record<string, unknown>;
      },
    );

    res.cookie('access_token', result.access_token, COOKIE_OPTIONS);
    return { user: result.user, access_token: result.access_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out' };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
