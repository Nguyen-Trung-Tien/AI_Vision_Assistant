import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

type ValidatedUser = Record<string, unknown>;

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('admin/login')
  async adminLogin(@Body() loginDto: LoginDto) {
    const user: ValidatedUser | null = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) throw new UnauthorizedException('Admin credentials required');
    if (user['__locked'])
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    if (user['role'] !== 'ADMIN')
      throw new UnauthorizedException('Admin credentials required');
    return this.authService.login(
      user as {
        id: string;
        email: string;
        role: string;
        accessibility_prefs: Record<string, unknown>;
      },
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user: ValidatedUser | null = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (user['__locked'])
      throw new UnauthorizedException('Tài khoản đã bị khoá bởi admin');
    return this.authService.login(
      user as {
        id: string;
        email: string;
        role: string;
        accessibility_prefs: Record<string, unknown>;
      },
    );
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
